import jwt from "jsonwebtoken";

const ACCESS_EXPIRES_IN = "10m";
const REFRESH_EXPIRES_IN = "7d";

/* =========================
   Sign Tokens
========================= */

export const signAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN,
      issuer: "event-management-api",
    }
  );
};

export const signRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN,
      issuer: "event-management-api",
    }
  );
};

/* =========================
   Verify Tokens (Safe)
========================= */

export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.type !== "access") throw new Error("Invalid token type");
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    console.log("🚀 ~ verifyRefreshToken ~ decoded:", decoded)

    if (decoded.type != "refresh") {
      throw new Error("Invalid token type");
    }

    if (!decoded.id) {
      throw new Error("Token missing user id");
    }

    return decoded;
  } catch {
    return null;
  }
};
