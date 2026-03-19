import pool from "../utils/db.mjs";

const notificationService = {
  listForUser: async (userId) => {
    const result = await pool.query(
      `SELECT id, order_id, type, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId],
    );
    return result.rows;
  },

  markAllRead: async (userId) => {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );
  },
};

export default notificationService;

