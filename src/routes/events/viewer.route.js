import express from "express";
import { authMiddleware } from "../../middleware/auth/auth.middleware.js";
import {
  trackEventView,
  getViewerStats,
  toggleViewerTracking,
  getEventViewers,
  deleteViewerRecords,
} from "../../controller/events/viewer.controller.js";

const viewerRouter = express.Router();

/* =====================================================
   PUBLIC ROUTE - Track View (optional auth)
===================================================== */
// Track when someone views an event
viewerRouter.post("/:eventId/track-view", trackEventView);

/* =====================================================
   PROTECTED ROUTES (Auth Required - Organizer/Admin)
===================================================== */

// Get viewer statistics for an event
viewerRouter.get("/:eventId/stats", authMiddleware, getViewerStats);

// Get all viewers for an event (paginated)
viewerRouter.get("/:eventId/viewers", authMiddleware, getEventViewers);

// Toggle viewer tracking on/off for an event
viewerRouter.patch("/:eventId/toggle-tracking", authMiddleware, toggleViewerTracking);

// Delete all viewer records for an event
viewerRouter.delete("/:eventId/viewers", authMiddleware, deleteViewerRecords);

export default viewerRouter;
