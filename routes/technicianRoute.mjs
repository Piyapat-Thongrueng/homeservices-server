import express from "express";
import technicianServices from "../services/technicianService.mjs";

const technicianRouter = express.Router();

// TODO: เปลี่ยนเป็น req.user.id หลัง authentication เสร็จ
const TEMP_TECHNICIAN_ID = 1;

// GET /api/technician/profile
technicianRouter.get("/profile", async (req, res) => {
  try {
    const profile =
      await technicianServices.getTechnicianProfile(TEMP_TECHNICIAN_ID);
    if (!profile) {
      return res.status(404).json({ message: "ไม่พบข้อมูลช่าง" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error fetching technician profile:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลช่าง" });
  }
});

export default technicianRouter;
