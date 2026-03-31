import express from "express";
import { authMiddleware } from "../../middleware/auth/auth.middleware.js";
import { getAllUsers,getAllUsersByRole, getUserDetail } from "../../controller/users/user.controller.js";

const userRouter =express.Router();

userRouter.get("/", authMiddleware,getAllUsers);
userRouter.get("/profile", authMiddleware,getUserDetail);
userRouter.get("/all",getAllUsersByRole);

export default userRouter;