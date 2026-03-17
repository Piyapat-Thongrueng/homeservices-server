import express from "express";
import technicianOrderService from "../services/technicianOrderService.mjs";
import protectTechnician from "../middlewares/protectTechnician.mjs";

const technicianOrderRouter = express.Router();

// GET /api/technician/orders/available
// fetch orders ที่ช่างสามารถรับได้ (status = 'completed' และยังไม่มีช่างคนไหนรับงานนี้ + ช่างคนนี้ยังไม่เคยปฏิเสธงานนี้)
technicianOrderRouter.get(
  "/orders/available",
  protectTechnician,
  async (req, res) => {
    try {
      const orders = await technicianOrderService.getAvailableOrders(
        req.user.id,
      );
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching available orders:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }
  },
);

// POST /api/technician/orders/:orderId/accept
// fetch จาก req.params.orderId และ req.user.id แล้วส่งไปที่ service เพื่อบันทึกว่าช่างคนนี้รับงานนี้แล้ว
technicianOrderRouter.post(
  "/orders/:orderId/accept",
  protectTechnician,
  async (req, res) => {
    try {
      const { orderId } = req.params; // ดึง orderId จาก endpoint params

      // เรียก service เพื่อพยายามรับงานนี้ (ถ้างานนี้มีช่างคนอื่นรับไปแล้ว service จะคืน { success: false, message: "งานนี้ถูกรับไปแล้ว" })
      const result = await technicianOrderService.acceptOrder(
        Number(orderId),
        req.user.id,
      );

      // ถ้าไม่สำเร็จ (เช่น งานนี้ถูกรับไปแล้ว) → ส่ง 409 Conflict กลับไปพร้อม message
      // 409 Conflict = งานถูกรับไปแล้ว (race condition)
      // return เพื่อหยุดไม่ให้รันบรรทัดถัดไป
      if (!result.success) {
        return res.status(409).json({ message: result.message });
      }

      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error("Error accepting order:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการรับงาน" });
    }
  },
);

// POST /api/technician/orders/:orderId/reject
// fetch จาก req.params.orderId และ req.user.id แล้วส่งไปที่ service เพื่อบันทึกว่าช่างคนนี้ปฏิเสธงานนี้แล้ว
technicianOrderRouter.post(
  "/orders/:orderId/reject",
  protectTechnician,
  async (req, res) => {
    try {
      const { orderId } = req.params; // ดึง orderId จาก endpoint params

      // เรียก service เพื่อบันทึกว่าช่างคนนี้ปฏิเสธงานนี้แล้ว (ถ้าช่างคนนี้ปฏิเสธไปแล้ว จะไม่ส่งผลอะไร เพราะ service จะบันทึกทุกครั้งที่กดปฏิเสธ)
      const result = await technicianOrderService.rejectOrder(
        Number(orderId),
        req.user.id,
      );

      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error("Error rejecting order:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการปฏิเสธงาน" });
    }
  },
);

export default technicianOrderRouter;
