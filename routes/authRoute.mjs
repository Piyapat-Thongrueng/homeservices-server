import express from "express";
import { googleOAuth, facebookOAuth } from "../services/authService.mjs";
import { createClient } from "@supabase/supabase-js";
import pool from "../utils/db.mjs";
import generateUsername from "../utils/generateusername.mjs";

// สร้าง Supabase client ด้วย URL และ ANON KEY จาก environment variables เพื่อเชื่อมต่อกับ Supabase Auth
// เราจะใช้ Supabase Auth สำหรับการจัดการผู้ใช้และการตรวจสอบสิทธิ์ ในขณะที่ข้อมูลผู้ใช้เพิ่มเติมจะถูกเก็บในฐานข้อมูล PostgreSQL ของเรา
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const authRouter = express.Router();

// Route สำหรับการลงทะเบียนผู้ใช้ (Register)
// ในขั้นตอนการลงทะเบียน เราจะตรวจสอบว่าอีเมลที่ผู้ใช้ส่งมานั้นซ้ำกับผู้ใช้อื่นหรือไม่ หากไม่ซ้ำ เราจะสร้างบัญชีผู้ใช้ใน Supabase Auth
// และเพิ่มข้อมูลผู้ใช้ในตาราง users ของฐานข้อมูล PostgreSQL

authRouter.post("/register", async (req, res) => {
  // ดึงข้อมูลที่ user ส่งมาจาก request body ซึ่งประกอบด้วย name, phone, email, password
  const { full_name, phone, email, password } = req.body;

  // Validate
  if (!full_name || !phone || !email || !password) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  try {
    // เราจะสร้างบัญชีผู้ใช้ใน Supabase Auth ด้วย email และ password ที่ผู้ใช้ส่งมา
    // หากการสร้างบัญชีผู้ใช้ใน Supabase Auth สำเร็จ เราจะได้รับข้อมูลผู้ใช้ใหม่ในตัวแปร data และหากมีข้อผิดพลาดจะถูกเก็บในตัวแปร supabaseError
    const { data, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
    });

    // หากมีข้อผิดพลาดในการสร้างบัญชีผู้ใช้ในSupabase Auth เราจะตรวจสอบว่าเป็นข้อผิดพลาดที่เกิดจากการที่มีผู้ใช้ที่มี email นี้อยู่แล้วหรือไม่ และส่ง response กลับไปยัง client ตามกรณี
    if (supabaseError) {
      // ตรวจสอบว่า error code เป็น "user_already_exists" หรือไม่ ซึ่งหมายความว่ามีผู้ใช้ที่มี email นี้อยู่แล้วในระบบ
      if (supabaseError.code === "user_already_exists") {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }
      return res
        .status(400)
        .json({ error: "Failed to create user. Please try again." });
    }

    // หากการสร้างบัญชีผู้ใช้ใน Supabase Auth สำเร็จ เราจะได้รับข้อมูลผู้ใช้ใหม่ในตัวแปร data ซึ่งประกอบด้วยข้อมูลต่าง ๆ ของผู้ใช้ รวมถึง id ของผู้ใช้ที่ถูกสร้างขึ้น
    const supabaseUserId = data.user.id;
    const username = generateUsername(email);

    // หลังจากที่เราสร้างบัญชีผู้ใช้ใน Supabase Auth สำเร็จ เราจะเพิ่มข้อมูลผู้ใช้ในตาราง users ของฐานข้อมูล PostgreSQL
    // โดยใช้ id ที่ได้จาก Supabase Auth เป็น primary key และเก็บข้อมูลเพิ่มเติมเช่น full_name, phone, email และ role
    const query = `
      INSERT INTO users (auth_user_id, full_name, phone, email, username, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    // เราจะใช้ parameterized query เพื่อป้องกัน SQL injection โดยการใช้ $1, $2, $3, $4, $5, $6 เป็นตัวแทนของค่าที่จะถูกแทรกเข้าไปใน
    // query และเก็บค่าที่จะถูกแทรกไว้ใน array values
    const values = [supabaseUserId, full_name, phone, email, username, "user"];

    // เราจะใช้ connectionPool.query เพื่อรัน query ที่เราเตรียมไว้ โดยส่ง query และ values เข้าไปเป็นพารามิเตอร์
    // และเก็บผลลัพธ์ที่ได้จากการรัน query ในตัวแปร rows ซึ่งจะเป็น array ของแถวที่ถูกแทรกเข้าไปในตาราง users
    const { rows } = await pool.query(query, values);
    // Rollback Supabase Auth ถ้า INSERT ล้มเหลว
    if (!rows[0]) {
      await supabase.auth.admin.deleteUser(supabaseUserId);
      return res.status(500).json({ error: "Failed to create user profile" });
    }

    res.status(201).json({
      message: "User created successfully",
      user: rows[0],
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

// ✅ OAuth routes
authRouter.get("/oauth/google", googleOAuth);
authRouter.get("/oauth/facebook", facebookOAuth);

export default authRouter;
