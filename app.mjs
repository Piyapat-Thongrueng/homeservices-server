import experss from "express";
import cors from "cors";
import "dotenv/config";

const app = experss();
const PORT = process.env.PORT || 4000;
app.use(experss.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend local (Vite)
      "http://localhost:3000", // Frontend local (React แบบอื่น)// Frontend ที่ Deploy แล้ว
      // ✅ ให้เปลี่ยน https://your-frontend.vercel.app เป็น URL จริงของ Frontend ที่ deploy แล้ว
    ],
  }),
);

// app.get("/api/users", async (req, res) => {
//   const response = await connectionPool.query("SELECT * FROM users");
//   res.status(200).json(response.rows);
// });

// app.post("/api/services", async (req, res) => {
//   try {
//     const { name, description, price, category_id } = req.body;
//     const response = await connectionPool.query(
//       "INSERT INTO services (name, description, price, category_id) VALUES ($1, $2, $3, $4) RETURNING *",
//       [name, description, price, category_id],
//     );
//     res.status(201).json(response.rows[0]);
//   } catch (error) {
//     console.error("Error inserting service:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.get("/test", (req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
