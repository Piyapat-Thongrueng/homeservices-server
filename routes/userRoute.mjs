import express from 'express';
import pool from '../utils/db.mjs'; 
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================================
// API บันทึกข้อมูลและรูปภาพ (POST)
// ==========================================
router.post('/:authUserUuid/update-profile', upload.single('profileImage'), async (req, res) => {
  try {
    const { authUserUuid } = req.params;
    const { name, phone, username } = req.body;

    // 1. หา User ปัจจุบัน และดึงรูปเก่ามาเก็บไว้ก่อน (เผื่อรอบนี้ไม่ได้อัปโหลดรูปใหม่)
    const userRes = await pool.query('SELECT id, profile_pic FROM users WHERE auth_user_id = $1', [authUserUuid]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });

    const internalUserId = userRes.rows[0].id;
    let profilePicUrl = userRes.rows[0].profile_pic;

    // 2. 📸 ถ้ามีการเลือกไฟล์รูปใหม่มาด้วย ให้เอาไปขึ้น Storage
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${authUserUuid}-${Date.now()}.${fileExt}`; // ชื่อไฟล์ไม่ซ้ำแน่นอน

      let uploadErrorMessage = null;
      try {
        const { error: uploadError } = await supabase.storage
          .from('avatars-picture')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
          });

        if (uploadError) {
          uploadErrorMessage = uploadError?.message || String(uploadError);
          console.error('Supabase upload error:', uploadErrorMessage);
        } else {
          // ได้ URL ใหม่ของรูปนี้มา
          profilePicUrl =
            supabase.storage
              .from('avatars-picture')
              .getPublicUrl(fileName).data.publicUrl;
        }
      } catch (e) {
        uploadErrorMessage = e?.message || String(e);
        console.error('Supabase upload exception:', uploadErrorMessage);
      }

      // ทำต่อแม้ upload รูปล้มเหลว เพื่อไม่ให้ผู้ใช้เจอ 500
      // (จะยังคงรูปเดิมไว้)
      if (uploadErrorMessage) {
        res.locals.uploadErrorMessage = uploadErrorMessage;
      }
    }

    // 3. 🌟 อัปเดตข้อมูลทั้งหมด (รวมถึง URL รูป) ลงในตาราง users ทันที! แบบรูปใครรูปมัน
    await pool.query(`
      UPDATE users 
      SET full_name = $1, phone = $2, username = $3, profile_pic = $4
      WHERE id = $5
    `, [name || '', phone || '', username || '', profilePicUrl, internalUserId]);

    // 3.5 Sync profile image into `user_profiles` too (Navbar uses /api/auth/get-user).
    // This app supports both `users.profile_pic` and `user_profiles.profile_pic/avatar_url`.
    await pool.query(`
      INSERT INTO user_profiles (user_id, profile_pic, avatar_url)
      VALUES ($1, $2, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET
        profile_pic = EXCLUDED.profile_pic,
        avatar_url = EXCLUDED.avatar_url
    `, [internalUserId, profilePicUrl]);

    res.status(200).json({
      message: 'อัปเดตข้อมูลสำเร็จ',
      profilePicUrl,
      uploadError: res.locals.uploadErrorMessage ?? null,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
});

export default router;