import express from "express";
import protectUser from "../middlewares/protectUser.mjs";
import notificationService from "../services/notificationService.mjs";

const notificationRoute = express.Router();

// GET /api/notifications - Get all notifications for the authenticated user
notificationRoute.get("/", protectUser, async (req, res) => {
  try {
    const userId = req.user.id; // DB integer id (resolved by protectUser)
    const notifications = await notificationService.listForUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read for the authenticated user
notificationRoute.patch("/read-all", protectUser, async (req, res) => {
  try {
    const userId = req.user.id; // DB integer id (resolved by protectUser)
    await notificationService.markAllRead(userId);
    res.json({ message: "อัปเดตเรียบร้อยแล้ว" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default notificationRoute;
