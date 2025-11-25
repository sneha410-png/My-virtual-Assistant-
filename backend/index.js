import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import geminiResponse from "./gemini.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Debug DB URL
console.log("Mongo URL:", process.env.MONGODB_URL);

// FIXED CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://my-virtual-assistant-0avd.onrender.com",
    "https://my-virtual-assistant-0avd.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// TEST ROUTE
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// API ROUTES
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// GEMINI ROUTE (at bottom)
app.get("/", async (req, res) => {
  let prompt = req.query.prompt;
  let data = await geminiResponse(prompt);
  res.json(data);
});

connectDb().then(() => {
  app.listen(port, () => console.log(`Server running at ${port}`));
}).catch((err) => {
  console.error("DB connection failed:", err);
  process.exit(1);
});
