import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import moment from "moment";

// ✅ Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "Get current user error" });
  }
};

// ✅ Update assistant
const updateAssistant = async (req, res) => {
  try {
    const { assistantName, assistantImage } = req.body;
    let finalImage;

    if (req.file) {
      finalImage = await uploadOnCloudinary(req.file.path);
    } else if (assistantImage) {
      finalImage = assistantImage;
    }

    const updatedFields = {};
    if (assistantName) updatedFields.assistantName = assistantName;
    if (finalImage) updatedFields.assistantImage = finalImage;

    const user = await User.findByIdAndUpdate(req.userId, updatedFields, {
      new: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    console.error("Update Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Ask Assistant
const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return res.status(400).json({ response: "Command missing" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ response: "User not found" });

    // ✅ Save command to history
    user.history = user.history || [];
    user.history.push(command);
    await user.save();

    const assistantName = user.assistantName || "Assistant";
    const userName = user.name || "User";

    // ✅ Get Gemini response (parsed JSON)
    const result = await geminiResponse(command, assistantName, userName);

    if (!result || typeof result !== "object") {
      console.warn("⚠️ Gemini response is invalid or not an object");
      return res.status(400).json({ response: "Invalid response from Gemini" });
    }

    const { type, userInput, response } = result;
    if (!type || !userInput || !response) {
      return res.status(400).json({ response: "Gemini response is incomplete." });
    }

    // ✅ Handle custom types
    switch (type) {
      case "get-date":
        return res.json({
          type,
          userInput,
          response: `Today's date is ${moment().format("DD-MM-YYYY")}`,
        });
      case "get-time":
        return res.json({
          type,
          userInput,
          response: `Current time is ${moment().format("hh:mm A")}`,
        });
      case "get-day":
        return res.json({
          type,
          userInput,
          response: `Today is ${moment().format("dddd")}`,
        });
      case "get-month":
        return res.json({
          type,
          userInput,
          response: `Current month is ${moment().format("MMMM")}`,
        });

      // ✅ Directly supported commands
      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
      case "linkedin-open":
      case "github-open":
      case "whatsapp-open":
      case "maps-open":
      case "general":
        return res.json({ type, userInput, response });

      default:
        return res.status(400).json({ response: "Unknown command type." });
    }
  } catch (error) {
    console.error("❌ askToAssistant Error:", error);
    return res.status(500).json({ response: "Server error while processing request." });
  }
};

export {
  getCurrentUser,
  updateAssistant,
  askToAssistant,
};
