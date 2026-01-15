
import { verifyAccessToken } from "../../utils/jwt.js";

import jwt from "jsonwebtoken";
import ApiError from "../../utils/ApiError.js";

export const authMiddleware = (req, _, next) => {
  try {
    // 1️⃣ Read access token from cookie
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      throw new ApiError(401, "Not authenticated");
    }

    // 2️⃣ Verify access token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    // 3️⃣ Attach user to request
    req.user = {
      id: decoded._id,
      role: decoded.role,
    };

    // 4️⃣ Continue
    next();
  } catch (error) {
    console.log(error);
    throw new ApiError(401, "Invalid or expired access token");
  }
};



export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Access token expired or invalid" });
  }
};
