import { Router } from "express";
import { initiateMAPayment, getMAPaymentStatus } from "./payments.controller.js";
import { paymentLimiter } from "./rateLimiters.js";

const router = Router();

router.post("/easypaisa/ma/initiate", paymentLimiter, initiateMAPayment);
router.get("/easypaisa/ma/status/:orderId", getMAPaymentStatus);

export default router;
