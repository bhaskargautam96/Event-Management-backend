import Joi from "joi";
import mongoose from "mongoose";

export const createTypeSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 3 characters",
    "any.required": "Name is required",
  }),
  description: Joi.string().trim().allow("").optional(),
});

export const createSubTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
    "any.required": "Name is required",
  }),

  description: Joi.string().trim().allow("").optional(),

  typeId: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .messages({
      "any.invalid": "Invalid typeId",
      "string.empty": "typeId is required",
      "any.required": "typeId is required",
    }),
});

export const createEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required().messages({
    "string.empty": "Title is required",
    "string.min": "Title must be at least 3 characters",
    "any.required": "Title is required",
  }),

  description: Joi.string().trim().required().messages({
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),

  typeId: Joi.string().trim().required().messages({
    "string.empty": "typeId is required",
    "any.required": "typeId is required",
  }),

  subTypeId: Joi.string().trim().optional().allow(""),

  // Location (sent as JSON string, will be parsed in controller)
  location: Joi.string().required().messages({
    "string.empty": "Location is required",
    "any.required": "Location is required",
  }),

  eventDate: Joi.date().iso().greater("now").required().messages({
    "date.base": "Event date must be a valid date",
    "date.greater": "Event date must be in the future",
    "any.required": "Event date is required",
  }),

  eventTime: Joi.string().optional().allow(""),

  duration: Joi.number().min(0).optional(),

  // Pricing (sent as JSON string)
  pricing: Joi.string().required().messages({
    "string.empty": "Pricing is required",
    "any.required": "Pricing is required",
  }),

  // Capacity (sent as JSON string)
  capacity: Joi.string().optional().allow(""),

  // Contact details (sent as JSON string)
  contactDetails: Joi.string().required().messages({
    "string.empty": "Contact details are required",
    "any.required": "Contact details are required",
  }),

  // Amenities (sent as JSON string array)
  amenities: Joi.string().optional().allow(""),

  // Specifications (sent as JSON string)
  specifications: Joi.string().optional().allow(""),

  // Features (sent as JSON string array)
  features: Joi.string().optional().allow(""),

  // Tags (sent as JSON string array)
  tags: Joi.string().optional().allow(""),

  // Booking settings (sent as JSON string)
  bookingSettings: Joi.string().optional().allow(""),

  // Status
  status: Joi.string()
    .valid("DRAFT", "ACTIVE", "COMPLETED", "CANCELLED", "PENDING_APPROVAL")
    .optional(),

  // Featured
  isFeatured: Joi.boolean().optional(),

  isPremium: Joi.boolean().optional(),

  // Metadata (sent as JSON string)
  metadata: Joi.string().optional().allow(""),
});

export const createBookingSchema = Joi.object({
  eventId: Joi.number().integer().positive().required().messages({
    "number.base": "eventId must be a number",
    "number.integer": "eventId must be an integer",
    "number.positive": "eventId must be positive",
    "any.required": "eventId is required",
  }),

  bookingDate: Joi.date().iso().greater("now").required().messages({
    "date.base": "Booking date must be a valid date",
    "date.greater": "Booking date must be in the future",
    "any.required": "Booking date is required",
  }),

  bookingTime: Joi.string().trim().optional().allow(""),

  duration: Joi.number().min(1).max(24).optional().messages({
    "number.base": "Duration must be a number",
    "number.min": "Duration must be at least 1 hour",
    "number.max": "Duration cannot exceed 24 hours",
  }),

  guestCount: Joi.number().integer().min(1).optional().messages({
    "number.base": "Guest count must be a number",
    "number.integer": "Guest count must be an integer",
    "number.min": "Guest count must be at least 1",
  }),

  userName: Joi.string().trim().min(2).max(100).optional().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
  }),

  userEmail: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),

  userPhone: Joi.string()
    .trim()
    .pattern(/^[0-9+\-\s()]+$/)
    .optional()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),

  specialRequirements: Joi.string().trim().max(1000).optional().allow(""),

  notes: Joi.string().trim().max(1000).optional().allow(""),
});
