import { Router } from "express";
import multer from "multer";
import postServiceValidate from "../middlewares/postServiceValidate.mjs";
import requireAuth from "../middlewares/authMiddleware.mjs";
import requireAdmin from "../middlewares/adminMiddleware.mjs";
import serviceController from "../controllers/serviceController.mjs";

const serviceRouter = Router();

// เก็บไฟล์รูปภาพในแรมของเซิร์ฟเวอร์ เช็คขนาดและประเภทไฟล์ก่อนอัปโหลดไปยัง Supabase Storage
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
    }
  },
});

const imageFileUpload = multerUpload.fields([
  { name: "imageFile", maxCount: 1 },
]);

// GET /api/services - ดึงข้อมูลบริการทั้งหมด
serviceRouter.get("/", serviceController.getServices);

// GET /api/services/:id - ดึงข้อมูลบริการตาม ID พร้อม items
serviceRouter.get("/:id", serviceController.getService);

// =======================================================
// POST /api/services - เพิ่มบริการใหม่
serviceRouter.post(
  "/",
  requireAuth,
  requireAdmin,
  imageFileUpload,
  postServiceValidate,
  serviceController.createService
);

// PUT /api/services/:id - อัปเดตบริการตาม ID
serviceRouter.put(
  "/:id",
  requireAuth,
  requireAdmin,
  imageFileUpload,
  serviceController.updateService
);

// DELETE /api/services/:id - ลบบริการตาม ID
serviceRouter.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  serviceController.deleteService
);

export default serviceRouter;