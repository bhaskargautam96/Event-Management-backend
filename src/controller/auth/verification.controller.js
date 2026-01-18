import asyncHandler from "../../middleware/asycnHandler.middleware.js";
import User from "../../model/user/user.schema.js";
import ApiError from "../../utils/ApiError";


export const verifyEmailController = asyncHandler(async (req, res) => {
   const { userId,otp } = req.params;
   const user = await User.findById(userId);
   if (!user) {
      throw new ApiError(404, "User not found");
   }
   if (user.isEmailVerified) {
      throw new ApiError(400, "Email already verified");
   }j
   if (user.otp !== otp) {
      throw new ApiError(400, "Invalid OTP");
   }
   user.isEmailVerified = true;
   user.otp = undefined;
   await user.save();
   return res.status(200).json(new ApiResponse("Email verified successfully"));
})