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
