import express from "express";
import { authMiddleware } from "../../middleware/auth/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createBookingSchema } from "../../validators/services.validator.js";
import {
  cancelBooking,
  checkSlotAvailability,
  createBooking,
  getAvailableDates,
  getBookingById,
  getEventBookings,
  getUserBookings,
  updateBookingStatus,
} from "../../controller/events/booking.controller.js";

const bookingRouter = express.Router();

/* =====================================================
   PUBLIC/SEMI-PUBLIC ROUTES
===================================================== */
// Check slot availability (no auth required)
bookingRouter.get("/check-availability", checkSlotAvailability);

// Get available dates for an event (no auth required)
bookingRouter.get("/available-dates/:eventId", getAvailableDates);

/* =====================================================
   USER ROUTES (Auth Required)
===================================================== */
// Create a new booking
bookingRouter.post(
  "/",
  authMiddleware,
  validate(createBookingSchema),
  createBooking
);

// Get user's own bookings
bookingRouter.get("/my-bookings", authMiddleware, getUserBookings);

// Get single booking details
bookingRouter.get("/:bookingId", authMiddleware, getBookingById);

// Cancel own booking
bookingRouter.patch(
  "/:bookingId/cancel",
  authMiddleware,
  cancelBooking
);

/* =====================================================
   ORGANIZER/ADMIN ROUTES
===================================================== */
// Get all bookings for an event (organizer/admin only)
bookingRouter.get("/event/:eventId", authMiddleware, getEventBookings);

// Update booking status (organizer/admin only)
bookingRouter.patch(
  "/:bookingId/status",
  authMiddleware,
  updateBookingStatus
);

export default bookingRouter;
