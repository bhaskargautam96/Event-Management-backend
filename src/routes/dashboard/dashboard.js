import express from "express";
import { getAllDashboardCounts } from "../../controller/dashboard/totalCount.controller.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/all-counts", getAllDashboardCounts);

export default dashboardRouter;