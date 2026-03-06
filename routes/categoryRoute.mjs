import { Router } from "express";
import categoryController from "../controllers/categoryController.mjs";

const categoryRouter = Router();

// GET /api/categories - ดึงข้อมูลหมวดหมู่ทั้งหมด
categoryRouter.get("/", categoryController.getCategories);

// GET /api/categories/:id - ดึงข้อมูลหมวดหมู่ตาม ID
categoryRouter.get("/:id", categoryController.getCategory);

// POST /api/categories - สร้างหมวดหมู่ใหม่
categoryRouter.post("/", categoryController.createCategory);

// PUT /api/categories/:id - อัปเดตหมวดหมู่ตาม ID
categoryRouter.put("/:id", categoryController.updateCategory);

// DELETE /api/categories/:id - ลบหมวดหมู่ตาม ID
categoryRouter.delete("/:id", categoryController.deleteCategory);

export default categoryRouter;