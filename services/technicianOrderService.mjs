import pool from "../utils/db.mjs";

const technicianOrderService = {
  // ✅ เพิ่ม radiusKm = 10 เป็น default (ถ้าไม่ส่งมา → ใช้ 10 กม.)
  getAvailableOrders: async (technicianId, radiusKm = 10) => {
    const result = await pool.query(
      `
      SELECT
        o.id,
        o.status,
        o.net_price,
        o.created_at,
        o.appointment_date,
        o.appointment_time,
        o.remark,
        CONCAT('AD', LPAD(o.id::TEXT, 8, '0')) AS order_code,
        a.address_line,
        a.subdistrict,
        a.district,
        a.province,

        -- ✅ จุดที่ 2: lat/lng ลูกค้า สำหรับส่งไป frontend แสดงแผนที่
        a.latitude AS customer_lat,
        a.longitude AS customer_lng,

        -- ✅ จุดที่ 2: คำนวณระยะทาง Haversine
        -- LEAST(1.0, ...) ป้องกัน floating point error
        -- เช่น cos() คืนค่า 1.0000000002 → acos() crash
        -- LEAST บังคับให้ไม่เกิน 1.0 เสมอ
        ROUND((6371 * acos(
          LEAST(1.0,
            cos(radians(up.latitude::float)) * cos(radians(a.latitude::float)) *
            cos(radians(a.longitude::float) - radians(up.longitude::float)) +
            sin(radians(up.latitude::float)) * sin(radians(a.latitude::float))
          )
        ))::numeric, 1) AS distance_km,

        array_agg(DISTINCT s.name) AS service_names,
        array_agg(DISTINCT si.name) FILTER (WHERE si.name IS NOT NULL) AS item_names

      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN services s ON oi.service_id = s.id
      LEFT JOIN service_items si ON s.id = si.service_id

      -- ✅ จุดที่ 1: JOIN user_profiles เพื่อดึง lat/lng ของช่าง
      JOIN user_profiles up ON up.user_id = $1

      WHERE o.status = 'completed'

        -- เงื่อนไขเดิม: ยังไม่มีช่างรับ
        AND NOT EXISTS (
          SELECT 1 FROM technician_assignments ta
          WHERE ta.order_id = o.id AND ta.status = 'assigned'
        )

        -- เงื่อนไขเดิม: ช่างคนนี้ยังไม่ปฏิเสธ
        AND NOT EXISTS (
          SELECT 1 FROM technician_assignments ta
          WHERE ta.order_id = o.id
            AND ta.technician_id = $1
            AND ta.status = 'rejected'
        )

        -- เงื่อนไขเดิม: กรองบริการที่ช่างรับได้
        AND EXISTS (
          SELECT 1
          FROM order_items oi2
          JOIN technician_services ts ON oi2.service_id = ts.service_id
          WHERE oi2.order_id = o.id
            AND ts.technician_id = $1
        )

        -- ✅ จุดที่ 3: กรอง NULL ออก ถ้าไม่มี lat/lng → คำนวณไม่ได้ → ไม่แสดง
        AND a.latitude IS NOT NULL
        AND a.longitude IS NOT NULL
        AND up.latitude IS NOT NULL
        AND up.longitude IS NOT NULL

      GROUP BY o.id, o.status, o.net_price, o.created_at,
               o.appointment_date, o.appointment_time, o.remark,
               a.address_line, a.subdistrict, a.district, a.province,
               a.latitude, a.longitude,    -- ✅ เพิ่มใน GROUP BY
               up.latitude, up.longitude   -- ✅ เพิ่มใน GROUP BY

      -- ✅ จุดที่ 4: กรองเฉพาะ order ที่อยู่ในรัศมีที่กำหนด
      -- HAVING ใช้แทน WHERE สำหรับ aggregate หรือค่าที่คำนวณ
      HAVING (6371 * acos(
        LEAST(1.0,
          cos(radians(up.latitude::float)) * cos(radians(a.latitude::float)) *
          cos(radians(a.longitude::float) - radians(up.longitude::float)) +
          sin(radians(up.latitude::float)) * sin(radians(a.latitude::float))
        )
      )) <= $2

      ORDER BY distance_km ASC  -- ✅ เรียงจากใกล้ไปไกล
      `,
      [technicianId, radiusKm], // ✅ ส่ง radiusKm เป็น $2
    );

    return result.rows.map((order) => ({
      id: order.id,
      order_code: order.order_code,
      status: order.status,
      net_price: Number(order.net_price),
      created_at: order.created_at,
      appointment_date: order.appointment_date,
      appointment_time: order.appointment_time,
      remark: order.remark,
      address: [
        order.address_line,
        order.subdistrict,
        order.district,
        order.province,
      ]
        .filter(Boolean)
        .join(" "),
      customer_lat: order.customer_lat ? Number(order.customer_lat) : null, // ✅ เพิ่ม
      customer_lng: order.customer_lng ? Number(order.customer_lng) : null, // ✅ เพิ่ม
      distance_km: Number(order.distance_km), // ✅ เพิ่ม
      service_names: order.service_names.filter(Boolean),
      item_names: order.item_names.filter(Boolean),
    }));
  },

  // acceptOrder และ rejectOrder เหมือนเดิม ไม่มีการแก้ไข
  acceptOrder: async (orderId, technicianId) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const checkResult = await client.query(
        `SELECT 1 FROM technician_assignments
         WHERE order_id = $1 AND status = 'assigned'`,
        [orderId],
      );
      if (checkResult.rows.length > 0) {
        await client.query("ROLLBACK");
        return { success: false, message: "งานนี้ถูกรับไปแล้ว" };
      }
      await client.query(
        `INSERT INTO technician_assignments (order_id, technician_id, status, assigned_at)
         VALUES ($1, $2, 'assigned', NOW())`,
        [orderId, technicianId],
      );
      await client.query(
        `UPDATE orders SET service_status = 'in_progress', updated_at = NOW()
         WHERE id = $1`,
        [orderId],
      );
      await client.query("COMMIT");
      return { success: true, message: "รับงานสำเร็จ" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  rejectOrder: async (orderId, technicianId) => {
    await pool.query(
      `INSERT INTO technician_assignments (order_id, technician_id, status, rejected_at)
       VALUES ($1, $2, 'rejected', NOW())`,
      [orderId, technicianId],
    );
    return { success: true, message: "ปฏิเสธงานสำเร็จ" };
  },
};

export default technicianOrderService;
