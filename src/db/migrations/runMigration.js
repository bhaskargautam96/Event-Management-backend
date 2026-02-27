import "dotenv/config";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sql from "../postgres.db.connection.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Run SQL migrations
 * Usage: node src/db/migrations/runMigration.js
 */
async function runMigrations() {
  try {
    console.log("🚀 Starting migrations...");

    // Read the migration files
    const eventsTablePath = join(__dirname, "001_create_events_table.sql");
    const bookingsTablePath = join(__dirname, "002_create_bookings_table.sql");
    const viewerTrackingPath = join(__dirname, "003_add_viewer_tracking.sql");
    const specsAndFeaturesPath = join(__dirname, "004_add_specifications_features.sql");
    
    const eventsSQL = fs.readFileSync(eventsTablePath, "utf8");
    const bookingsSQL = fs.readFileSync(bookingsTablePath, "utf8");
    const viewerTrackingSQL = fs.readFileSync(viewerTrackingPath, "utf8");
    const specsAndFeaturesSQL = fs.readFileSync(specsAndFeaturesPath, "utf8");

    // Execute the migrations
    console.log("📝 Running events table migration...");
    await sql.unsafe(eventsSQL);
    console.log("✅ Events table created");

    console.log("📝 Running bookings table migration...");
    await sql.unsafe(bookingsSQL);
    console.log("✅ Bookings table created");

    console.log("📝 Running viewer tracking migration...");
    await sql.unsafe(viewerTrackingSQL);
    console.log("✅ Viewer tracking added");

    console.log("📝 Running specifications & features migration...");
    await sql.unsafe(specsAndFeaturesSQL);
    console.log("✅ Specifications & features added");

    console.log("\n✅ All migrations completed successfully!");
    console.log("📋 Created tables:");
    console.log("   - events (with indexes and triggers)");
    console.log("   - event_bookings (with indexes, triggers, and slot conflict checking)");
    console.log("   - event_viewers (with indexes for tracking)");
    console.log("   - Views: event_slot_availability, event_viewer_stats, event_top_viewers");
    console.log("   - Added: specifications, features columns");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
