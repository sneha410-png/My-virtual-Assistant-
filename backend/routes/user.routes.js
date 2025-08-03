import express from "express";
import multer from "multer";
import isAuth from "../middlewares/isAuth.js";
import {
  getCurrentUser,
  updateAssistant,
  askToAssistant,
} from "../controllers/user.controllers.js";

// ✅ Setup multer
const upload = multer({ dest: "uploads/" });

const userRouter = express.Router();

// ✅ Routes
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, updateAssistant);
userRouter.post("/customize", isAuth, upload.single("assistantImage"), updateAssistant);
userRouter.post("/asktoassistant", isAuth, askToAssistant);

// ✅ Default export
export default userRouter;
