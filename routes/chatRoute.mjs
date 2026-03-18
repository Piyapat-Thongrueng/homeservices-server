import express from "express"
import pool from "../utils/db.mjs"

const router = express.Router()

router.get("/:orderId/chat-info", async (req, res) => {
  try {

    const { orderId } = req.params

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" })
    }

    // ใช้ int (จาก DB )
    if (!/^\d+$/.test(orderId)) {
      return res.status(400).json({ error: "Invalid orderId" })
    }

    const query = `
      SELECT
        o.id AS order_id,

        c.id AS customer_id,
        c.full_name AS customer_name,

        t.id AS technician_id,
        t.full_name AS technician_name

      FROM orders o

      LEFT JOIN users c ON o.user_id = c.id
      LEFT JOIN users t ON o.technician_id = t.id

      WHERE o.id = $1
      LIMIT 1
    `

    const { rows } = await pool.query(query, [orderId])

    if (!rows.length) {
      return res.status(404).json({ error: "Order not found" })
    }

    const row = rows[0]

    res.json({
      customer: {
        id: row.customer_id,
        name: row.customer_name || "Customer"
      },
      technician: row.technician_id
        ? {
            id: row.technician_id,
            name: row.technician_name || "Technician"
          }
        : null
    })

  } catch (err) {
    console.error("❌ Chat info error:", err)
    res.status(500).json({ error: "Failed to load chat info" })
  }
})

export default router