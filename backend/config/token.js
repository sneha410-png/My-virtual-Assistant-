import jwt from "jsonwebtoken";

const genToken = async (userId) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("❌ JWT_SECRET is missing from .env");
    }

    const token = await jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });

    return token;
  } catch (error) {
    console.error("❌ Token generation error:", error.message);
    return null;
  }
};

export default genToken;
