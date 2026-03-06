import express from "express";
import {
  registerUser,
  loginUser,
  googleOAuth,
  facebookOAuth
} from "../services/authService.mjs";

console.log("AUTH ROUTE LOADED");
console.log("LOGIN USER FUNCTION:", loginUser);

const router = express.Router();

// =======================================================
// REGISTER
// =======================================================

router.post("/register", registerUser);

// =======================================================
// LOGIN (TEST ROUTE)
// =======================================================

router.post("/login", loginUser);

// =======================================================
// OAUTH
// =======================================================

router.get("/oauth/google", googleOAuth);
router.get("/oauth/facebook", facebookOAuth);

export default router;