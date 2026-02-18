import express from "express";
import { authMiddleware } from "../../middleware/auth/auth.middleware.js";
import { getUserDetail } from "../../controller/users/user.controller.js";

const userRouter =express.Router();

userRouter.get("/", authMiddleware,getUserDetail);

export default userRouter;