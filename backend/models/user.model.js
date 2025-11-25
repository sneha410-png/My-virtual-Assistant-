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
      default: "", 
    },
    history: {
      type: [String], 
      default: [],     
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
