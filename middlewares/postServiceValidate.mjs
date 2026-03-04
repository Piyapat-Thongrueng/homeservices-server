/**
 * Middleware สำหรับ validate ข้อมูลก่อนสร้าง service
 * รองรับ multipart/form-data (มีทั้งไฟล์ + JSON string สำหรับ items)
 */
const validateCreateService = (req, res, next) => {
  const errors = [];
  const { name, category_id, description, items } = req.body;

  // ── 1. Validate name ──────────────────────────────────────────────
  if (!name || typeof name !== "string" || name.trim() === "") {
    errors.push("name: ชื่อบริการห้ามว่าง");
  } else if (name.trim().length > 100) {
    errors.push("name: ชื่อบริการต้องไม่เกิน 100 ตัวอักษร");
  }

  // ── 2. Validate category_id ───────────────────────────────────────
  if (!category_id) {
    errors.push("category_id: กรุณาเลือกหมวดหมู่");
  } else if (isNaN(Number(category_id)) || Number(category_id) <= 0) {
    errors.push("category_id: หมวดหมู่ไม่ถูกต้อง");
  }

  // ── 3. Validate image file ─────────────────────────────────────────
  if (!req.files || !req.files.imageFile || req.files.imageFile.length === 0) {
    errors.push("imageFile: กรุณาอัปโหลดรูปภาพ");
  }

  // ── 4. Validate description (optional) ───────────────────────────
  if (
    description &&
    typeof description === "string" &&
    description.length > 500
  ) {
    errors.push("description: คำอธิบายต้องไม่เกิน 500 ตัวอักษร");
  }

  // ── 5. Validate items (sub-services) ─────────────────────────────
  if (!items) {
    errors.push("items: กรุณาเพิ่มรายการบริการย่อยอย่างน้อย 1 รายการ");
  } else {
    let parsedItems;

    // items ส่งมาเป็น JSON string ใน multipart/form-data
    try {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
    } catch {
      errors.push("items: รูปแบบข้อมูลไม่ถูกต้อง (ต้องเป็น JSON)");
      return res.status(400).json({ success: false, errors });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      errors.push("items: ต้องมีรายการบริการย่อยอย่างน้อย 1 รายการ");
    } else {
      parsedItems.forEach((item, index) => {
        const prefix = `items[${index}]`;

        if (
          !item.name ||
          typeof item.name !== "string" ||
          item.name.trim() === ""
        ) {
          errors.push(`${prefix}.name: ชื่อรายการห้ามว่าง`);
        }

        if (item.price_per_unit === undefined || item.price_per_unit === null) {
          errors.push(`${prefix}.price_per_unit: กรุณาระบุค่าบริการ`);
        } else if (
          isNaN(Number(item.price_per_unit)) ||
          Number(item.price_per_unit) < 0
        ) {
          errors.push(
            `${prefix}.price_per_unit: ค่าบริการต้องเป็นตัวเลขที่ไม่ติดลบ`,
          );
        }

        if (
          !item.unit ||
          typeof item.unit !== "string" ||
          item.unit.trim() === ""
        ) {
          errors.push(`${prefix}.unit: กรุณาระบุหน่วยการบริการ`);
        }
      });

      // แนบ parsed items ไว้บน req เพื่อให้ controller ใช้ต่อได้เลย
      req.parsedItems = parsedItems;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
};

export default validateCreateService;
