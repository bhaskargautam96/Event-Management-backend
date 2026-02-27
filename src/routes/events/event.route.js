import express from "express";
import { authMiddleware, passCookieOptional } from "../../middleware/auth/auth.middleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createEventSchema } from "../../validators/services.validator.js";
import {
  createEvent,
  deleteEvent,
  deleteEventImages,
  getAllEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  updateEventStatus,
} from "../../controller/events/event.controller.js";

const eventRouter = express.Router();

/* =====================================================
   PUBLIC ROUTES (Optional Auth)
===================================================== */
// Get all events (public with optional auth for filtering)
eventRouter.get("/", passCookieOptional, getAllEvents);

// Get single event by ID
eventRouter.get("/:id", getEventById);

/* =====================================================
   PROTECTED ROUTES (Auth Required)
===================================================== */
// Get my events (organizer's own events)
eventRouter.get("/my/events", authMiddleware, getMyEvents);

// Create event (with multiple images)
eventRouter.post(
  "/",
  authMiddleware,
  upload.array("images", 10), // Allow up to 10 images
  validate(createEventSchema),
  createEvent
);

// Update event (with optional image upload)
eventRouter.put(
  "/:id",
  authMiddleware,
  upload.array("images", 10),
  updateEvent
);

// Delete specific images from event
eventRouter.delete(
  "/:id/images",
  authMiddleware,
  deleteEventImages
);

// Delete event (soft delete)
eventRouter.delete("/:id", authMiddleware, deleteEvent);

/* =====================================================
   ADMIN ROUTES
===================================================== */
// Update event status (admin only)
eventRouter.patch(
  "/:id/status",
  authMiddleware,
  updateEventStatus
);

export default eventRouter;
