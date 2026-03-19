import pool from "../utils/db.mjs";

const formatThaiStatus = (status) => {
  let thaiStatus = status;
  if (status === "pending") thaiStatus = "รอดำเนินการ";
  if (status === "in_progress") thaiStatus = "กำลังดำเนินการ";
  if (status === "completed") thaiStatus = "ดำเนินการสำเร็จ";
  if (status === "cancelled") thaiStatus = "ยกเลิกคำสั่งซ่อม";
  return thaiStatus;
};

const orderService = {
  listMyOrdersByInternalUserId: async (internalUserId) => {
    const query = `
      SELECT
        o.id,
        o.service_status AS status,
        o.created_at AS date,
        o.net_price AS price,
        up.full_name AS worker,
        array_agg(s.name) FILTER (WHERE s.name IS NOT NULL) AS details
      FROM orders o

      LEFT JOIN LATERAL (
        SELECT technician_id
        FROM technician_assignments ta
        WHERE ta.order_id = o.id
        ORDER BY ta.id DESC
        LIMIT 1
      ) ta ON true

      LEFT JOIN user_profiles up
        ON ta.technician_id = up.user_id

      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN services s ON oi.service_id = s.id
      WHERE o.user_id = $1
      GROUP BY o.id, o.service_status, o.created_at, o.net_price, up.full_name
      ORDER BY o.created_at DESC
    `;

    const { rows } = await pool.query(query, [internalUserId]);

    return rows.map((order) => ({
      ...order,
      status: formatThaiStatus(order.status),
      worker: order.worker || "ยังไม่ระบุช่าง",
      details: order.details ? order.details.filter((d) => d != null) : [],
    }));
  },

  getOrderDetailById: async (id) => {
    const query = `
      SELECT
        o.id,
        o.service_status AS status,
        o.created_at,
        o.total_price,
        o.net_price,
        o.appointment_date,
        o.appointment_time,
        array_agg(s.name) FILTER (WHERE s.name IS NOT NULL) AS services,
        up.full_name AS technician_name,
        up.phone AS technician_phone,
        a.address_line,
        a.district,
        a.province,
        a.postal_code
      FROM orders o

      LEFT JOIN LATERAL (
        SELECT technician_id
        FROM technician_assignments ta
        WHERE ta.order_id = o.id
        ORDER BY ta.id DESC
        LIMIT 1
      ) ta ON true

      LEFT JOIN user_profiles up
        ON ta.technician_id = up.user_id

      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN services s ON oi.service_id = s.id
      LEFT JOIN addresses a ON o.user_id = a.user_id
      WHERE o.id = $1
      GROUP BY
        o.id,
        up.full_name,
        up.phone,
        a.address_line,
        a.district,
        a.province,
        a.postal_code
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] ?? null;
  },
};

export default orderService;

