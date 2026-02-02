

import express from "express";
import { logoutAllController, logoutController, refreshTokenController } from "../../controller/auth/auth.controller.js";
import passport from "passport";
import { googleAuthCallback } from "../../controller/auth/google.controller.js";
import { authMiddleware } from "../../middleware/auth/auth.middleware.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { loginController } from "../../controller/auth/login.controller.js";
import { registerController } from "../../controller/users/register.controller.js";
import { sendEmailVerificationOtp, verifyEmailOtp } from "../../controller/auth/verification.controller.js";

const authRouter = express.Router();

authRouter.get("/refresh-token", refreshTokenController);
authRouter.post("/logout", logoutController);
authRouter.post("/login", loginController);
authRouter.post("/register", registerController);
authRouter.post("/send-verification-otp", sendEmailVerificationOtp);
authRouter.post("/verify-otp", verifyEmailOtp);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account"
  }),
);

// Google redirects here
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleAuthCallback
);


authRouter.get("/authenticated", authMiddleware, (req, res) => {
  res.status(200).json(
    new ApiResponse("Authenticated user", {
      user: req.user,
      accessToken: req.cookies.accessToken,
      refreshToken: req.cookies.refreshToken,
    })
  );
});


export default authRouter;
