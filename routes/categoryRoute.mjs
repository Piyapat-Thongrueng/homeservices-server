import { Router } from "express";
import protectAdmin from "../middlewares/protectAdmin.mjs";
import categoryService from "../services/categoryService.mjs";

const categoryRouter = Router();

// GET /api/categories - ดึงข้อมูลหมวดหมู่ทั้งหมด
categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await categoryService.listAll();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/categories/:id - ดึงข้อมูลหมวดหมู่ตาม ID
categoryRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const rows = await categoryService.findById(id);
    if (!rows.length) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/categories - สร้างหมวดหมู่ใหม่
categoryRouter.post("/", protectAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  try {
    const created = await categoryService.create({ name });
    res.status(201).json(created);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/categories/:id - อัปเดตหมวดหมู่ตาม ID
categoryRouter.put("/:id", protectAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  try {
    const updated = await categoryService.update({ id, name });
    if (!updated) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/categories/:id - ลบหมวดหมู่ตาม ID
categoryRouter.delete("/:id", protectAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await categoryService.deleteById(id);
    if (!deleted) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default categoryRouter;
