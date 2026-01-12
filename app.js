import express from "express";
import connectToMongoDB from "./src/db/mongo.db.connection.js";
import  "dotenv/config"
import sql from "./src/db/postgres.db.connection.js";
// dotenv.config()
const app = express();

await connectToMongoDB()
app.use(express.json());

// PostgreSQL (TEST)
try {
  const result = await sql`select 1 as connected`;
  console.log("PostgreSQL connected ✅", result);
} catch (error) {
  console.error("PostgreSQL connection failed ❌", error);
}


app.get("/", (req, res) => {
  res.json({ message: "Docker backend running 🚀" });
});

export default app;
