// cookies.js
const isProd = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/", // 🔥 REQUIRED
  maxAge: 60 * 60 * 1000,
  domain: ".eventwaale.in" ,
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/", // 🔥 REQUIRED
  maxAge: 7 * 24 * 60 * 60 * 1000,
  domain: ".eventwaale.in" ,
};
