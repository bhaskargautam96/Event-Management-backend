
import { verifyAccessToken } from "../../utils/jwt.js";

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
