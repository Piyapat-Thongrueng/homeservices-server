import bcrypt from "bcrypt";
import connectionPool from "../utils/db.mjs";

export const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // ✅ validation
    if (!email || !username || !password) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // ✅ check email exists
    const existingUser = await connectionPool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "Email already exists",
      });
    }

 // ✅ hash password
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// ✅ insert user
await connectionPool.query(
  `INSERT INTO users (email, username, password_hash)
   VALUES ($1, $2, $3)`,
  [email, username, hashedPassword]
);

    return res.status(201).json({
      message: "Register success ✅",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error",
    });
  }
};