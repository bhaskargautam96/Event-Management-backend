
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../../config/cookies.js";
import User from "../../model/user/user.schema.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";

/* =====================================================
   REGISTER
===================================================== */
export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      authProvider: "LOCAL",
      isSocialAccount: false,
      isEmailVerified: false,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // 🔐 SET COOKIES HERE (THIS IS THE ANSWER)
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

