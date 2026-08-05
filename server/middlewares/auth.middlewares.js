// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import user_model from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const { user_token } = req.cookies;
    
    if (!user_token) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);
    
    const user = await user_model.findById(user_id);
    
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
      error: err.message,
    });
  }
};
