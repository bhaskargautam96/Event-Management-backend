import express from "express";
import { authMiddleware } from "../../middleware/auth/auth.middleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import {
  addTypeCategories,
  deleteTypeCategory,
  updatTypeCategory,
  getTypeCategories,
} from "../../controller/events/type.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createTypeSchema } from "../../validators/services.validator.js";

const typeCategoryRouter = express.Router();

typeCategoryRouter.get("/category", authMiddleware, getTypeCategories);
typeCategoryRouter.get("/list-category",getTypeCategories)
typeCategoryRouter.post(
  "/category",
  authMiddleware,
  upload.single("image"),
  validate(createTypeSchema),
  addTypeCategories,
);
typeCategoryRouter.patch(
  "/category/:id",
  authMiddleware,
  upload.single("image"),
  updatTypeCategory,
);
typeCategoryRouter.delete("/category/:id", authMiddleware, deleteTypeCategory);

export default typeCategoryRouter;
