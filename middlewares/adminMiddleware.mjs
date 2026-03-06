import pool from "../utils/db.mjs";

const requireAdmin = async (req, res, next) => {
  try {

    const userId = req.user.id;

    const result = await pool.query(
      "SELECT role FROM users WHERE auth_user_id=$1",
      [userId]
    );

    const role = result.rows[0]?.role;

    if (role !== "admin") {
      return res.status(403).json({
        error: "Admin access required"
      });
    }

    next();

  } catch (err) {

    return res.status(500).json({
      error: "Admin middleware error"
    });

  }
};

export default requireAdmin;