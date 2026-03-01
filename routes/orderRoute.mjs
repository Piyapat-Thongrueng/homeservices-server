import express from 'express';
import pool from '../utils/db.mjs'; 

const router = express.Router();

// ดึงข้อมูลออเดอร์ของ User ตาม ID
router.get('/my-orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // SQL Query ดึงข้อมูลและ Join ตารางที่เกี่ยวข้อง
    const query = `
      SELECT 
        o.id, 
        o.status, 
        o.created_at as date, 
        o.total_price as price,  --  ใน public.txt คุณใช้คำว่า total_price นะครับ ไม่ใช่ net_price
        tp.full_name as worker,
        array_agg(s.name) as details
      FROM orders o
      INNER JOIN users u ON o.user_id = u.id -- 1. เพิ่มบรรทัดนี้เพื่อเชื่อมตาราง users
      LEFT JOIN technician_assignments ta ON o.id = ta.order_id
      LEFT JOIN user_profiles tp ON ta.technician_id = tp.user_id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN services s ON oi.service_id = s.id
      WHERE u.auth_user_id = $1              -- 2. เปลี่ยนมาเทียบกับ auth_user_id แทน
      GROUP BY o.id, o.status, o.created_at, o.total_price, tp.full_name
      ORDER BY o.created_at DESC;
    `;

    const { rows } = await pool.query(query, [userId]);

    // จัดรูปแบบข้อมูลเล็กน้อยก่อนส่งกลับ (Format วันที่, ราคา)
    const formattedOrders = rows.map(order => ({
      id: `AD${String(order.id).padStart(8, '0')}`, // จำลองรหัสออเดอร์ เช่น AD00000012
      status: order.status, 
      // แปลงวันที่ให้อ่านง่ายขึ้น
      date: new Date(order.date).toLocaleString('th-TH', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit' 
      }) + ' น.',
      worker: order.worker || 'รอการจัดสรรช่าง', // ถ้ายังไม่มีช่าง
      price: Number(order.price).toLocaleString('th-TH', { minimumFractionDigits: 2 }),
      details: order.details.filter(d => d !== null) // กรองค่า null ออก
    }));

    res.json(formattedOrders);

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;