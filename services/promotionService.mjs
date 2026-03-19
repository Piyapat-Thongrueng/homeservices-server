import pool from "../utils/db.mjs";

const promotionService = {
  listAll: async () => {
    const result = await pool.query(
      "SELECT * FROM promotions ORDER BY created_at DESC",
    );
    return result.rows;
  },

  create: async ({ code, type, discount_value, usage_limit, expiry_date }) => {
    const query = `
      INSERT INTO promotions (code, type, discount_value, usage_limit, used_count, expiry_date, active)
      VALUES ($1, $2, $3, $4, 0, $5, true) RETURNING *;
    `;
    const values = [
      code,
      type,
      discount_value,
      usage_limit,
      expiry_date,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  update: async ({ id, code, type, discount_value, usage_limit, expiry_date }) => {
    const oldDataRes = await pool.query("SELECT * FROM promotions WHERE id = $1", [id]);
    if (oldDataRes.rows.length === 0) return null;
    const oldData = oldDataRes.rows[0];

    const updateQuery = `
      UPDATE promotions 
      SET code = $1, type = $2, discount_value = $3, usage_limit = $4, expiry_date = $5
      WHERE id = $6 RETURNING *;
    `;
    const updateResult = await pool.query(updateQuery, [
      code,
      type,
      discount_value,
      usage_limit,
      expiry_date,
      id,
    ]);

    let changes = [];
    if (oldData.code !== code) changes.push(`ชื่อโค้ดจาก ${oldData.code} เป็น ${code}`);
    if (Number(oldData.discount_value) !== Number(discount_value)) {
      changes.push(`ส่วนลดจาก ${oldData.discount_value} เป็น ${discount_value}`);
    }
    if (Number(oldData.usage_limit) !== Number(usage_limit)) {
      changes.push(`โควต้าจาก ${oldData.usage_limit} เป็น ${usage_limit}`);
    }

    if (changes.length > 0) {
      await pool.query(
        "INSERT INTO promotion_logs (promotion_id, action, detail) VALUES ($1, $2, $3)",
        [id, "UPDATE", `แก้ไข: ${changes.join(", ")}`],
      );
    }

    return updateResult.rows[0];
  },

  deleteById: async (id) => {
    await pool.query("DELETE FROM promotions WHERE id = $1", [id]);
    await pool.query(
      "INSERT INTO promotion_logs (promotion_id, action, detail) VALUES ($1, $2, $3)",
      [id, "DELETE", "ลบโปรโมชันออกจากระบบ"],
    );
    return true;
  },
};

export default promotionService;

