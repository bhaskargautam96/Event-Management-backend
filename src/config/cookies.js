// cookies.js
const isProd = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd , // Force true in prod (onrender is HTTPS)
  sameSite: isProd ? "none" : "lax",
  path: "/", // Good
  maxAge: 60 * 60 * 1000,
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
