import express from 'express';
import requireAuth from "../middlewares/authMiddleware.mjs";
import orderController from "../controllers/orderController.mjs";

const router = express.Router();

// ดึงข้อมูลออเดอร์ของ User ตาม ID
router.get('/my-orders/:userId', requireAuth, orderController.getMyOrders);

 // #บรรทัดนี้จะต้องถูกลบเมื่อเสรร็จงาน 
// POST /api/orders/mock - ยิงเพื่อสร้างออเดอร์จำลองสำหรับทดสอบ UI
router.post('/mock', orderController.createMockOrder);

// #บรรทัดที่ต้องถูกลบจะสุดที่ตรงนี้

export default router;