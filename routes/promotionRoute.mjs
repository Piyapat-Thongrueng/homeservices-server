import express from 'express';
import promotionService from "../services/promotionService.mjs";

const router = express.Router();

// 1. GET - ดึงข้อมูลโปรโมชันทั้งหมด
router.get('/', async (req, res) => {
  try {
    const promotions = await promotionService.listAll();
    res.json(promotions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// 2. POST - สร้างโปรโมชันใหม่
router.post('/', async (req, res) => {
  try {
    const { code, type, discount_value, usage_limit, expiry_date } = req.body;

    const created = await promotionService.create({
      code,
      type,
      discount_value,
      usage_limit,
      expiry_date,
    });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: "ชื่อ Promotion Code นี้มีในระบบแล้ว" });
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT - แก้ไขข้อมูลและเก็บบันทึกประวัติ (Audit Log)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, type, discount_value, usage_limit, expiry_date } = req.body;
    const updated = await promotionService.update({
      id,
      code,
      type,
      discount_value,
      usage_limit,
      expiry_date,
    });
    if (!updated) return res.status(404).json({ error: "ไม่พบข้อมูล" });
    res.json(updated);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: "ชื่อ Promotion Code นี้มีในระบบแล้ว" });
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE - ลบโปรโมชันและเก็บบันทึก
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await promotionService.deleteById(id);
    res.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;