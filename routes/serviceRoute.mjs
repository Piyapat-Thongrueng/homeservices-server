import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const serviceRouter = Router();

// GET /api/services - ดึงข้อมูลบริการทั้งหมด
serviceRouter.get("/", async (req, res) => {
  try {
    const response = await connectionPool.query("SELECT * FROM services");
    res.status(200).json(response.rows);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/services/:id - ดึงข้อมูลบริการตาม ID
serviceRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await connectionPool.query(
      "SELECT * FROM services WHERE id = $1",
      [id],
    );
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    res.status(200).json(response.rows[0]);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/services - เพิ่มบริการใหม่
serviceRouter.post("/", async (req, res) => {
  try {
    const { name, description, price, category_id } = req.body;
    const response = await connectionPool.query(
      "INSERT INTO services (name, description, price, category_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description, price, category_id],
    );
    res.status(201).json(response.rows[0]);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/services/:id - อัปเดตบริการตาม ID
serviceRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_id } = req.body;
  try {
    const response = await connectionPool.query(
      "SELECT * FROM services WHERE id = $1",
      [id],
    );
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    const updateResponse = await connectionPool.query(
      "UPDATE services SET name = $1, description = $2, price = $3, category_id = $4 WHERE id = $5 RETURNING *",
      [name, description, price, category_id, id],
    );
    res.status(200).json(updateResponse.rows[0]);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/services/:id - ลบบริการตาม ID
serviceRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await connectionPool.query(
      "SELECT * FROM services WHERE id = $1",
      [id],
    );
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }
    await connectionPool.query("DELETE FROM services WHERE id = $1", [id]);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default serviceRouter;
