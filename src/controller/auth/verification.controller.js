import { redisConnection } from "../../config/redis.js";
import asyncHandler from "../../middleware/asycnHandler.middleware.js";
import User from "../../model/user/user.schema.js";
import { mailQueue } from "../../queues/index.js";
import { renderEmailTemplate } from "../../services/email/template.service.js";
import ApiError from "../../utils/ApiError.js";
import { generateOTP } from "../../utils/generateOtp.js";

export const sendEmailVerificationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  // if (!user) {
  //   throw new ApiError(404, "User not found");
  // }

  if (user?.isEmailVerified) {
    throw new ApiError(400, "Email already verified");
  }

  // 1️⃣ Generate OTP
  const otp = generateOTP();

  const redisKey = `email:otp:${email}`;
  const otpExpirySeconds = 30;
  const expiryText = otpExpirySeconds < 60 ? `${otpExpirySeconds} seconds` : `${Math.floor(otpExpirySeconds / 60)} minutes`;

  // 2️⃣ Store OTP in Redis with TTL (5 min)
  await redisConnection.set(redisKey, otp, "EX", otpExpirySeconds); // expiry time in seconds 30-seconds for testing

  const html = await renderEmailTemplate("email/verification-otp.ejs", {
    otp,
    expiryText,
  });

  // 3️⃣ Send OTP via mail queue
  await mailQueue.add("email-verification-otp", {
    to: email,
    subject: "Email Verification Code",
    html,
  });

  res.status(200).json({
    success: true,
    message: "Verification OTP sent to email",
    data: {
      email,
      otp,
    },
  });
});

export const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const redisKey = `email:otp:${email}`;

  // ✅ READ OTP FROM REDIS
  const storedOtp = await redisConnection.get(redisKey);

  // ❌ OTP expired or never existed
  if (!storedOtp) {
    throw new ApiError(400, "OTP expired or invalid");
  }

  // ❌ OTP does not match
  if (storedOtp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  // ✅ OTP VERIFIED
  // (Optional) mark email verified in DB here

  // ✅ REMOVE OTP AFTER SUCCESS
  await redisConnection.del(redisKey);

  res.json({
    success: true,
    message: "OTP verified successfully",
  });
});
