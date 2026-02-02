const isProd = process.env.NODE_ENV === "production";

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true, // ALWAYS true
  secure: isProd, // true in prod
  sameSite: isProd ? "none" : "lax",
  path: "/", // IMPORTANT
  maxAge: 60 * 60 * 1000, // 1 hour
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true, // ALWAYS true
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/", // IMPORTANT
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
