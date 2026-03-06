import pool from "../utils/db.mjs";

// =======================================================
// INSERT USER PROFILE
// =======================================================

export const createUserProfile = async (userId, username, phone) => {

  await pool.query(
    `
      INSERT INTO users (auth_user_id, username, phone, role)
      VALUES ($1,$2,$3,$4)
    `,
    [userId, username, phone, "user"]
  );

};