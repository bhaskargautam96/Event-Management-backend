import { Router } from "express";
import { sendWelcomeMail } from "../../controllers/mail.controller.js";

const router = Router();

// POST /api/v1/mail/welcome
router.post("/welcome", sendWelcomeMail);

export default router;
