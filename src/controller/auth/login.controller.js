import asyncHandler from "../../middleware/asycnHandler.middleware.js";
import User from "../../model/user/user.schema.js";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../../config/cookies.js";
import { generatePassword } from "../../utils/generatePassword.js";
import ApiError from "../../utils/ApiError.js";


export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new ApiError(400, "All fields are required");
        }
        const user = await User.findOne({ email }).select("+password");

        console.log("🚀 ~ loginController ~ user:", user.password)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
    
        const isMatch =bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new ApiError(401, "Invalid credentials");
        }
    
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
    
        // console.log("Login controller");
        user.refreshTokens.push({ token: refreshToken });
        await user.save();
        res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
        res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
        return res.json({
            status:200,
            message:"Login successfully",
            // user
        })
    } catch (error) {
        throw error;
    }


}


export const passwordGenerate = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 1️⃣ Generate new password
    const newPassword = generatePassword(10);

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3️⃣ Save password
    user.password = hashedPassword;
    await user.save();

    // 4️⃣ (Optional) Send mail
    // await sendMail({
    //   to: user.email,
    //   subject: "Your new password",
    //   html: `<p>Your new password is <b>${newPassword}</b></p>`
    // });

    return res.status(200).json({
      success: true,
      message: "Password generated successfully",
      // ❌ DO NOT send password in response (security)
    });
  } catch (error) {
    throw error;
  }
};

export const setPasswordController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // 🚨 Only allow for social accounts WITHOUT password
    // if (!user.isSocialAccount) {
    //   throw new ApiError(400, "Password already exists for this account");
    // }

    if (user.password) {
      throw new ApiError(400, "Password already set. Please login.");
    }

    // ✅ User creates password (plain)
    user.password = password;

    // Optional: convert to hybrid login
    user.isSocialAccount = false;
    user.authProvider = "LOCAL";

    await user.save(); // pre-save hashes password

    return res.status(200).json({
      success: true,
      message:
        "Password created successfully. You can now login using email and password.",
    });
  } catch (error) {
    throw error;
  }
};
