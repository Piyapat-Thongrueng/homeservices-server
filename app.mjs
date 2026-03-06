import "dotenv/config";
import express from "express";
import cors from "cors";

import ServiceRoute from "./routes/serviceRoute.mjs";
import categoryRoute from "./routes/categoryRoute.mjs";
import authRoute from "./routes/authRoute.mjs";
import OrderRoute from "./routes/orderRoute.mjs";
import adminRoute from "./routes/adminRoute.mjs"; // ⭐ admin route

const app = express();
const PORT = process.env.PORT || 4000;

// ==============================
// MIDDLEWARE
// ==============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://homeservices-frontend-gold.vercel.app",
    ],
  })
);

// ==============================
// API ROUTES
// ==============================

app.use("/api/services", ServiceRoute);
app.use("/api/auth", authRoute);

app.use("/api/categories", categoryRoute);
app.use("/api/orders", OrderRoute);

// ⭐ admin routes (protected)
app.use("/api/admin", adminRoute);

// ==============================
// TEST ROUTE
// ==============================

app.get("/test", (req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

// ==============================
// 404 HANDLER
// ==============================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ==============================
// START SERVER
// ==============================

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});