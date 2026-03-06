import * as authService from "../services/authService.mjs";

// =======================================================
// REGISTER USER
// =======================================================

export const registerUser = async (req, res) => {

  try {

    const { email, password, username, phone } = req.body;

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

    const result =
      await authService.registerUser({
        email,
        password,
        username,
        phone,
      });

    res.status(201).json(result);

  } catch (err) {

    console.error("Register Error:", err);

    res.status(500).json({
      error: err.message
    });

  }

};