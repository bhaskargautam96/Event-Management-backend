import express from "express";
import  "dotenv/config"
import connectToMongoDB from "./src/db/mongo.db.connection.js";
import sql from "./src/db/postgres.db.connection.js";
import authRouter from "./src/routes/auth/auth.route.js";
import { allowedOrigins, routerVersion1 } from "./src/constants.js";

import passport from "./src/config/passport.js";
import errorHandler from "./src/middleware/errorHandler.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { redisConnection } from "./src/config/redis.js";
import userRouter from "./src/routes/user/user.route.js";
// dotenv.config()
const app = express();

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










app.use(errorHandler);
app.get("/", (req, res) => {
  res.json({ message: "Event Management backend running 🚀" });
});

export default app;
