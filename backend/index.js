import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path"; // This import is here, but 'path' is not used in the provided snippet. Keep if used elsewhere.

// Import your database connection function
import connectDb from "./config/db.js";
// Import your API routes
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
// Import your Gemini response function (assuming it's a utility)
import geminiResponse from "./gemini.js";

// Load environment variables from .env file
// This must be called at the very beginning of your application
dotenv.config();

// Initialize the Express application
const app = express();
// Define the port, defaulting to 5000 if not set in environment variables
const port = process.env.PORT || 5000;

// --- CRITICAL DEBUGGING STEP FOR MONGODB_URL ---
// Log the MongoDB URL to ensure it's being loaded correctly from your .env file.
// If this logs 'undefined' or an incorrect string, that's your problem!
console.log("Attempting to connect to MongoDB with URL:", process.env.MONGODB_URL);
// --- END DEBUGGING STEP ---

// ✅ Enable CORS for frontend requests
// This allows your frontend (e.g., running on http://localhost:5173)
// to make requests to this backend server.
app.use(cors({
  origin: "http://localhost:5173", // Specify your frontend's origin
  credentials: true // Crucial for sending/receiving cookies (like session tokens)
}));

// ✅ Middlewares
// Parse JSON request bodies
app.use(express.json());
// Parse cookies attached to the request
app.use(cookieParser());
// Serve static files from the 'uploads' directory
// This is useful if you're serving uploaded images or other static assets
app.use('/uploads', express.static('uploads'));

// ✅ API Routes
// Mount authentication routes under /api/auth
app.use("/api/auth", authRouter);
// Mount user-related routes under /api/user
app.use("/api/user", userRouter);

// Example route for Gemini response (consider moving to a dedicated route file if it grows)
app.get("/", async (req, res) => {
  let prompt = req.query.prompt;
  let data = await geminiResponse(prompt); // Call your Gemini utility function
  res.json(data);
});

// ✅ Start Server after Database is Connected
// This ensures that your application doesn't try to perform database operations
// before the connection to MongoDB is fully established.
connectDb().then(() => {
  // If the database connection is successful, start the Express server
  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
}).catch((err) => {
  // If the database connection fails, log the error and exit the process
  console.error("❌ DB connection failed:", err);
  // It's good practice to exit the process if the DB connection is critical
  process.exit(1);
});
