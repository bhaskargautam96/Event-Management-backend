import express  from "express";
import { getCityList, getCountryList, getStateList } from "../controller/location/location.controller.js";

const locationRouter = express.Router();
/* =====================================================
    PUBLIC ROUTES (Optional Auth)
===================================================== */

locationRouter.get("/countries", getCountryList)
locationRouter.get("/states", getStateList)
locationRouter.get("/cities", getCityList)


export default locationRouter;

