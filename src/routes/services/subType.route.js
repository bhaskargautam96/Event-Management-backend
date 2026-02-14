import express from "express";
import { authMiddleware } from "../../middleware/auth/auth.middleware.js";
import { upload } from "../../middleware/multer.middleware.js";
import {
  addSubTypeCategories,
  deleteSubTypeCategory,
  getSubTypeCategories,
  updatSubTypeCategory,
} from "../../controller/events/subType.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createSubTypeSchema } from "../../validators/services.validator.js";

const subTypeCategoryRouter = express.Router();

subTypeCategoryRouter.get(
  "/sub-category",
  authMiddleware,
  getSubTypeCategories,
);
subTypeCategoryRouter.post(
  "/sub-category",
  authMiddleware,
  upload.single("image"),
  validate(createSubTypeSchema),
  addSubTypeCategories,
);
subTypeCategoryRouter.patch(
  "/sub-category/:id",
  authMiddleware,
  upload.single("image"),
  updatSubTypeCategory,
);
subTypeCategoryRouter.delete(
  "/sub-category/:id",
  authMiddleware,
  deleteSubTypeCategory,
);

export default subTypeCategoryRouter;
