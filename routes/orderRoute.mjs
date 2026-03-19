import express from 'express';
import pool from '../utils/db.mjs'; 
import orderService from "../services/orderService.mjs";

const router = express.Router();

// GET /api/orders/my-orders/:userId - ดึงข้อมูลออเดอร์ของ User ตาม ID (แบบละเอียด)
router.get('/my-orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const isNumeric = /^[0-9]+$/.test(userId);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    // ถ้าไม่ใช่ทั้ง integer และ UUID (เช่น "null", "undefined") ให้ return ทันที
    if (!isNumeric && !isUUID) {
      return res.json([]);
    }

    let internalUserId;

    if (isNumeric) {
      // internal integer id — ใช้ได้เลย
      internalUserId = parseInt(userId, 10);
    } else {
      // Supabase auth UUID — lookup internal id
      const { rows: userRows } = await pool.query(
        'SELECT id FROM users WHERE auth_user_id = $1::uuid',
        [userId]
      );
      if (userRows.length === 0) return res.json([]);
      internalUserId = userRows[0].id;
    }

    const formattedRows = await orderService.listMyOrdersByInternalUserId(internalUserId);
    res.json(formattedRows);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET Order Detail by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderDetailById(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);

  } catch (error) {
    console.error("Error fetching order detail:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;