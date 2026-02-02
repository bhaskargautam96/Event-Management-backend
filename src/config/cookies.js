// cookies.js
const isProd = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Force true in prod (onrender is HTTPS)
  sameSite:"lax",
  path: "/", // Good
  maxAge: 60 * 60 * 1000,
  // domain: ".eventwaale.in"  ← REMOVE THIS LINE (or comment it out)
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite:"lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // domain: ".eventwaale.in"  ← REMOVE THIS LINE
};
