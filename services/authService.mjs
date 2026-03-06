import { createClient } from "@supabase/supabase-js";
import connectionPool from "../utils/db.mjs";

let supabase;

// =======================================================
// CREATE SUPABASE CLIENT (singleton)
// =======================================================

const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
};

// =======================================================
// REGISTER USER
// =======================================================

export const registerUser = async (req, res) => {
  try {

    const { email, password, username, phone } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!email || !password || !username || !phone) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        error: "Password must be at least 12 characters",
      });
    }

    const supabase = getSupabase();

    // ===============================
    // CREATE AUTH USER
    // ===============================

    const { data, error } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    const userId = data.user.id;

    // ===============================
    // INSERT USER PROFILE
    // ===============================

    await connectionPool.query(
      `
      INSERT INTO users (auth_user_id, username, phone, role)
      VALUES ($1,$2,$3,$4)
      `,
      [userId, username, phone, "user"]
    );

    res.status(201).json({
      message: "Register success",
    });

  } catch (err) {

    console.error("Register Error:", err);

    res.status(500).json({
      error: "Register failed",
    });

  }
};

// =======================================================
// LOGIN USER
// =======================================================

export const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    const supabase = getSupabase();

    // ===============================
    // LOGIN WITH SUPABASE
    // ===============================

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return res.status(401).json({
        error: error.message,
      });
    }

    // ===============================
    // RETURN ACCESS TOKEN
    // ===============================

    res.json({
      message: "Login success",
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    });

  } catch (err) {

    console.error("Login Error:", err);

    res.status(500).json({
      error: "Login failed",
    });

  }
};

// =======================================================
// GOOGLE OAUTH
// =======================================================

export const googleOAuth = async (req, res) => {
  try {

    const supabase = getSupabase();

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: process.env.OAUTH_REDIRECT_URL,
        },
      });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.redirect(data.url);

  } catch (err) {

    console.error("Google OAuth Error:", err);

    res.status(500).json({
      error: "OAuth failed",
    });

  }
};

// =======================================================
// FACEBOOK OAUTH
// =======================================================

export const facebookOAuth = async (req, res) => {
  try {

    const supabase = getSupabase();

    const { data, error } =
      await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: process.env.OAUTH_REDIRECT_URL,
        },
      });

    if (error) {
      return res.status(500).json({
        error: error.message,
      });
    }

    return res.redirect(data.url);

  } catch (err) {

    console.error("Facebook OAuth Error:", err);

    res.status(500).json({
      error: "OAuth failed",
    });

  }
};