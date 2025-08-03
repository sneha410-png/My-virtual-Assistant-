import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
    },
    assistantName: {
      type: String,
      default: "Assistant",
    },
    assistantImage: {
      type: String,
      default: "", // Optional: you can set a default image path
    },
    history: {
      type: [String], // Array of strings
      default: [],     // Always initialize with empty array
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
