import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const categoryRouter = Router();

// GET /api/categories - ดึงข้อมูลหมวดหมู่ทั้งหมด
categoryRouter.get("/", async (req, res) => {
  try {
    const result = await connectionPool.query("SELECT * FROM categories");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/categories/:id - ดึงข้อมูลหมวดหมู่ตาม ID
categoryRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await connectionPool.query(
      "SELECT * FROM categories WHERE id = $1",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default categoryRouter;
