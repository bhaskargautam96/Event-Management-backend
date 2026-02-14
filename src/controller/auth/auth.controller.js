import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../../config/cookies.js";
import asyncHandler from "../../middleware/asycnHandler.middleware.js";
import User from "../../model/user/user.schema.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";



/* =====================================================
   1️⃣ REFRESH TOKEN CONTROLLER (ROTATION)
===================================================== */
export const refreshTokenController = asyncHandler(async (req, res) => {
  // 🔥 1️⃣ Read refresh token from COOKIE
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing", "NO_REFRESH_COOKIE");
  }

  // 🔥 2️⃣ Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // 🔥 3️⃣ Find user
  const user = await User.findById(decoded.id).select("+refreshTokens");
  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // 🔥 4️⃣ Check token reuse
  const tokenExists = user.refreshTokens.some((t) => t.token === refreshToken);

  if (!tokenExists) {
    user.refreshTokens = [];
    await user.save();
    throw new ApiError(403, "Token reuse detected. Please login again.");
  }

  // 🔥 5️⃣ Rotate refresh token  
  user.refreshTokens = user.refreshTokens.filter(
    (t) => t.token !== refreshToken
  );

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  user.refreshTokens.push({ token: newRefreshToken });
  await user.save();

  // 🔥 6️⃣ Overwrite cookies
  res.cookie("accessToken", newAccessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE_OPTIONS);

  // 🔥 7️⃣ Return success ONLY
  return res.status(200).json(new ApiResponse("Access token refreshed"));
});

/* =====================================================
   2️⃣ LOGOUT (SINGLE DEVICE)
===================================================== */
export const logoutController = async (req, res) => {
  try {
    // 🔥 1️⃣ Read refresh token from COOKIE
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);

      if (decoded) {
        const user = await User.findById(decoded.id);

        if (user) {
          // 🔥 2️⃣ Remove this refresh token from DB
          user.refreshTokens = user.refreshTokens.filter(
            (t) => t.token !== refreshToken
          );
          await user.save();
        }
      }
    }

    // 🔥 3️⃣ Clear cookies (THIS IS LOGOUT)
    res.clearCookie("accessToken", ACCESS_COOKIE_OPTIONS);
    res.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(new ApiResponse("Logged out successfully"));
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
/* =====================================================
   3️⃣ LOGOUT FROM ALL DEVICES
===================================================== */
export const logoutAllController = async (req, res) => {
  try {
    const userId = req.user.id; // from access token middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({
      message: "Logged out from all devices successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};






// cust