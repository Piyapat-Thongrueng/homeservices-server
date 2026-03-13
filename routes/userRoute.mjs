import express from 'express';
import pool from '../utils/db.mjs'; 
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// ==========================================
// 1. ตั้งค่าพื้นฐาน (Multer & Supabase)
// ==========================================
// (Multer) ให้เก็บไฟล์ไว้ใน Memory
const upload = multer({ storage: multer.memoryStorage() });

// เชื่อมต่อ Supabase ฝั่ง Backend
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 👈 แก้ตรงนี้ครับ
  );

// ==========================================
// 2. API ดึงข้อมูลที่อยู่ (GET) - เอาไว้แสดงตอนเปิดหน้าเว็บ
// ==========================================
router.get('/:authUserUuid/address', async (req, res) => {
    try {
      const { authUserUuid } = req.params;
      
      // 🛑 แก้ SQL ให้ดึงทั้งข้อมูล User และ profile_pic จากตาราง user_profiles มาด้วย
      const userRes = await pool.query(`
        SELECT u.id, up.profile_pic 
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.auth_user_id = $1
      `, [authUserUuid]);
  
      if (userRes.rows.length === 0) return res.json({});
      const userData = userRes.rows[0];
  
      // ดึงที่อยู่ (เหมือนเดิม)
      const addrRes = await pool.query('SELECT * FROM addresses WHERE user_id = $1 LIMIT 1', [userData.id]);
      
      const dbAddr = addrRes.rows.length > 0 ? addrRes.rows[0] : {};
  
      // 🛑 ส่ง profile_pic กลับไปให้ Frontend ด้วย
      res.json({
        profile_pic: userData.profile_pic, // ลิงก์รูปภาพ
        address_line: dbAddr.address_line,
        district: dbAddr.city,
        province: dbAddr.province,
        postal_code: dbAddr.postal_code,
        sub_district: ""
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
  });

// ==========================================
// 3. API อัปเดตข้อมูลผู้ใช้แบบจัดเต็ม (อัปโหลดรูป + ที่อยู่)
// เส้นทาง: POST /api/users/:authUserUuid/update-profile
// ==========================================
router.post('/:authUserUuid/update-profile', upload.single('profileImage'), async (req, res) => {
  try {
    const { authUserUuid } = req.params;
    
    // รับค่าที่ส่งมาจาก FormData ของ Frontend
    const { address_line, sub_district, district, province, postal_code } = req.body;

    // 1. หารหัส User ID ของ Database
    const userRes = await pool.query('SELECT id FROM users WHERE auth_user_id = $1', [authUserUuid]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
    const internalUserId = userRes.rows[0].id;

    let profilePicUrl = null;

    // 2. 📸 จัดการอัปโหลดรูปลง Supabase Storage (ถ้ามีแนบไฟล์มา)
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${authUserUuid}-${Date.now()}.${fileExt}`;

      // อัปโหลดไฟล์จาก Memory (req.file.buffer) ขึ้น Supabase
      const { error: uploadError } = await supabase.storage
        .from('avatars-picture') // ชื่อถังเก็บรูป (Bucket) ต้องตรงกับใน Supabase
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // ขอลิงก์ Public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars-picture')
        .getPublicUrl(fileName);

      profilePicUrl = publicUrlData.publicUrl;

      // เซฟลิงก์รูปลงตาราง user_profiles
      await pool.query(`
        UPDATE user_profiles SET profile_pic = $1 WHERE user_id = $2
      `, [profilePicUrl, internalUserId]);
    }

    // 3. 🏠 จัดการบันทึกที่อยู่ (ดัดแปลงให้เข้ากับ DB เดิม)
    if (address_line || province) {
      // เอาตำบลไปต่อท้ายรายละเอียดที่อยู่
      const combinedAddressLine = sub_district ? `${address_line} ตำบล/แขวง ${sub_district}` : address_line;
      // เอาอำเภอไปใส่ในช่อง city
      const cityValue = district;

      // เช็คว่าเคยมีที่อยู่หรือยัง?
      const checkExist = await pool.query('SELECT id FROM addresses WHERE user_id = $1', [internalUserId]);

      if (checkExist.rows.length > 0) {
        await pool.query(`
          UPDATE addresses 
          SET address_line = $1, city = $2, province = $3, postal_code = $4
          WHERE user_id = $5
        `, [combinedAddressLine, cityValue, province, postal_code, internalUserId]);
      } else {
        await pool.query(`
          INSERT INTO addresses (user_id, address_line, city, province, postal_code)
          VALUES ($1, $2, $3, $4, $5)
        `, [internalUserId, combinedAddressLine, cityValue, province, postal_code]);
      }
    }

    res.status(200).json({ 
      message: "อัปเดตข้อมูลและรูปโปรไฟล์สำเร็จ!",
      profilePicUrl: profilePicUrl 
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
});

export default router;