import User from "../../model/user/user.schema.js";
import { signAccessToken, signRefreshToken } from "../../utils/jwt.js";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../../config/cookies.js";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        profileImage: picture,
        authProvider: "GOOGLE",
        isSocialAccount: true,
        isEmailVerified: true,
        socialAccounts: { googleId },
      });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // 🔐 5️⃣ SET COOKIES (THIS REPLACES URL TOKENS)
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      message: "Google authentication failed",
    });
  }
};

export const googleAuthCallback = async (req, res) => {
  try {
    const profile = req.user;

    const googleId = profile.id;
    const email = profile.emails?.[0]?.value || null;
    const name = profile.displayName;
    const profileImage = profile.photos?.[0]?.value || "";

    let user;

    // 1️⃣ Find by Google ID
    user = await User.findOne({
      "socialAccounts.googleId": googleId,
    });

    // 2️⃣ Link by email
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.socialAccounts.googleId = googleId;
        user.isSocialAccount = true;
        user.authProvider = "GOOGLE";
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // 3️⃣ Register new user
    if (!user) {
      user = await User.create({
        name,
        email,
        profileImage,
        authProvider: "GOOGLE",
        isSocialAccount: true,
        isEmailVerified: true,
        socialAccounts: { googleId },
      });
    }

    // 4️⃣ Generate tokens
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // 🔐 5️⃣ SET COOKIES (THIS REPLACES URL TOKENS)
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);

    // 6️⃣ Redirect WITHOUT tokens
    return res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=google_oauth_failed`,
    );
  }
};
