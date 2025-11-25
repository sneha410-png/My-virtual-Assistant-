import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";

import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import geminiResponse from "./gemini.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Debug DB URL
console.log("Mongo URL:", process.env.MONGODB_URL);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://my-virtual-assistant-0avd.onrender.com",
    "https://my-virtual-assistant-0avd.vercel.app"
  ],
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Gemini Route
app.get("/", async (req, res) => {
  let prompt = req.query.prompt;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });
  try {
    const data = await geminiResponse(prompt);
    res.json(data);
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: "Gemini API failed" });
  }
});

// Connect DB & Start Server
connectDb()
  .then(() => {
    app.listen(port, () => console.log(`Server running at ${port}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });
