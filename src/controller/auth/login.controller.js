import asyncHandler from "../../middleware/asycnHandler.middleware.js";
import User from "../../model/user/user.schema.js";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import { ACCESS_COOKIE_OPTIONS, REFRESH_COOKIE_OPTIONS } from "../../config/cookies.js";


export const loginController = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isMatch =bcrypt.compareSync(password, user.password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push({ token: refreshToken });
    await user.save();
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);


});