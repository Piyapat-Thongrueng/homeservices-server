import express from "express";
import { registerUser } from "../services/authService.mjs";

const router = express.Router();

router.post("/register", registerUser);

export default router;