import { Router } from "express";
import { submitContactForm } from "./contact.controller.js";
import { contactFormLimiter } from "./rateLimiters.js";

const router = Router();

router.post("/", contactFormLimiter, submitContactForm);

export default router;
