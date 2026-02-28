import express from "express";
import cors from "cors";
import "dotenv/config";
// import ServiceRoute from "./routes/serviceRoute.mjs";
import categoryRoute from "./routes/categoryRoute.mjs";
import authRoute from "./routes/authRoute.mjs";

const app = express();
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend local (Vite)
      "http://localhost:3000", // Frontend local (React แบบอื่น)// Frontend ที่ Deploy แล้ว
      "https://homeservices-frontend-gold.vercel.app",
      // ✅ ให้เปลี่ยน https://your-frontend.vercel.app เป็น URL จริงของ Frontend ที่ deploy แล้ว
    ],
  }),
);

// app.use("/api/services", ServiceRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/auth", authRoute);


app.get("/test", (req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
