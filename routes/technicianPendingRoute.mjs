import express from "express";
import pool from "../utils/db.mjs";

const router = express.Router();



/* =========================================================
   GET Pending Jobs for Technician
   ========================================================= */

router.get("/pending", async (req, res) => {
  try {

    const query = `
      SELECT 
        o.id,
        o.status,
        o.created_at,
        o.total_price,
        array_agg(s.name) FILTER (WHERE s.name IS NOT NULL) AS services
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN services s ON oi.service_id = s.id
      WHERE o.status = 'pending'
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `;

    const { rows } = await pool.query(query);

    res.json(rows);

  } catch (error) {
    console.error("Error fetching pending jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



/* =========================================================
   GET In Progress Jobs for Technician
   ========================================================= */

router.get("/in-progress", async (req, res) => {
  try {

    const query = `
      SELECT 
        o.id,
        o.status,
        o.created_at,
        o.total_price,
        array_agg(s.name) FILTER (WHERE s.name IS NOT NULL) AS services
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN services s ON oi.service_id = s.id
      WHERE o.status = 'in_progress'
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `;

    const { rows } = await pool.query(query);

    res.json(rows);

  } catch (error) {
    console.error("Error fetching in-progress jobs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



/* =========================================================
   GET Single Job Detail
   ใช้สำหรับหน้า technician-job/:id
   ========================================================= */

router.get("/job/:orderId", async (req, res) => {
  try {

    const { orderId } = req.params;

    const query = `
      SELECT 
        o.id,
        o.status,
        o.created_at,
        o.total_price,
        array_agg(s.name) FILTER (WHERE s.name IS NOT NULL) AS services
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN services s ON oi.service_id = s.id
      WHERE o.id = $1
      GROUP BY o.id
    `;

    const { rows } = await pool.query(query, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error("Error fetching job detail:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



/* =========================================================
   ACCEPT JOB
   เปลี่ยนสถานะงานจาก pending → in_progress
   ========================================================= */

router.patch("/accept/:orderId", async (req, res) => {
  try {

    const { orderId } = req.params;

    const query = `
      UPDATE orders
      SET status = 'in_progress'
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    res.json({
      message: "Job accepted successfully",
      order: rows[0]
    });

  } catch (error) {
    console.error("Error accepting job:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



/* =========================================================
   COMPLETE JOB
   เปลี่ยนสถานะงานจาก in_progress → completed
   ========================================================= */

router.patch("/complete/:orderId", async (req, res) => {
  try {

    const { orderId } = req.params;

    const query = `
      UPDATE orders
      SET status = 'completed'
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    res.json({
      message: "Job completed successfully",
      order: rows[0]
    });

  } catch (error) {
    console.error("Error completing job:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


/* =========================================================
   GET Job Counters (Sidebar Badge)
   ========================================================= */

   router.get("/counters", async (req, res) => {
    try {
  
      const query = `
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed
        FROM orders
      `;
  
      const { rows } = await pool.query(query);
  
      res.json(rows[0]);
  
    } catch (error) {
      console.error("Error fetching counters:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

export default router;