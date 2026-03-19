import "dotenv/config";
import express from "express";
import { allowedOrigins, routerVersion1 } from "./src/constants.js";
import connectToMongoDB from "./src/db/mongo.db.connection.js";
import sql from "./src/db/postgres.db.connection.js";
import authRouter from "./src/routes/auth/auth.route.js";

import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./src/config/passport.js";
import { getDeviceInfo } from "./src/controller/ipDevice.controller.js";
import { passCookieOptional } from "./src/middleware/auth/auth.middleware.js";
import errorHandler from "./src/middleware/errorHandler.middleware.js";
import subTypeCategoryRouter from "./src/routes/services/subType.route.js";
import typeCategoryRouter from "./src/routes/services/type.route.js";
import userRouter from "./src/routes/user/user.route.js";
import eventRouter from "./src/routes/events/event.route.js";
import bookingRouter from "./src/routes/events/booking.route.js";
import viewerRouter from "./src/routes/events/viewer.route.js";
import locationRouter from "./src/routes/location.route.js";
// dotenv.config()
const app = express();

app.set("trust proxy", true);

await connectToMongoDB()

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`), false);
      }
    },
    credentials: true, // 🔥 REQUIRED
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(passport.initialize());
app.use(express.json());
app.use(cookieParser());

// PostgreSQL (TEST) DATABASE CONNECTION
try {
  const result = await sql`select 1 as connected`;
  console.log("PostgreSQL connected ✅", result);
} catch (error) {
  console.error("PostgreSQL connection failed ❌", error);
}

app.use(`${routerVersion1}/auth`, authRouter);
app.use(`${routerVersion1}/user`, userRouter);
app.use(`${routerVersion1}/service`, typeCategoryRouter);
app.use(`${routerVersion1}/service`, subTypeCategoryRouter);
app.use(`${routerVersion1}/events`, eventRouter);
app.use(`${routerVersion1}/bookings`, bookingRouter);
app.use(`${routerVersion1}/viewers`, viewerRouter);
app.use(`${routerVersion1}/location`, locationRouter);











app.use(errorHandler);
app.get("/", (req, res) => {
  res.json({ message: "Event Management backend running 🚀" });
});
app.get("/api/v1/device-info", passCookieOptional,
   getDeviceInfo);

export default app;
