import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    console.log("🍪 Cookies received:", req.cookies);

    const token = req.cookies.token;

    if (!token) {
      console.log("🚫 Token not found in cookies");
      return res.status(401).json({ message: "Unauthorized: token not found" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not set in .env");
      return res.status(500).json({ message: "Server misconfiguration: JWT_SECRET missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.userId) {
      console.log("❌ Invalid token structure:", decoded);
      return res.status(401).json({ message: "Unauthorized: invalid token payload" });
    }

    req.userId = decoded.userId;

    console.log("✅ Authenticated userId:", req.userId);
    next();
  } catch (error) {
    console.error("❌ isAuth error:", error.message);
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};

export default isAuth;
