import type { Request, Response, NextFunction } from "express";
import { easypaisaService } from "./easypaisa-service.js";
import { initiateMASchema } from "./validators.js";
import { ApiError } from "./apiError.js";

// Swap this for a real database table (e.g. Postgres/Mongo) in production.
const orders = new Map<string, { status: string; transactionId?: string; amount: string | number }>();

export async function initiateMAPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = initiateMASchema.parse(req.body);

    const result = await easypaisaService.initiateMATransaction(input);

    if (result.responseCode !== "0000") {
      throw new ApiError(400, easypaisaService.describeResponseCode(result.responseCode));
    }

    orders.set(input.orderId, {
      status: "PENDING",
      transactionId: result.transactionId,
      amount: input.amount,
    });

    res.json({
      success: true,
      message: "Payment request sent. Ask the customer to approve it on their phone.",
      transactionId: result.transactionId,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMAPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;
    if (!orderId) throw new ApiError(400, "orderId is required");

    const order = orders.get(orderId);

    const result = await easypaisaService.inquireTransactionStatus({ orderId });

    if (result.responseCode !== "0000") {
      throw new ApiError(400, easypaisaService.describeResponseCode(result.responseCode));
    }

    if (result.transactionStatus === "PAID" && order) {
      order.status = "PAID";
    }

    res.json({
      success: true,
      orderId,
      status: result.transactionStatus ?? order?.status ?? "PENDING",
      amount: result.transactionAmount ?? order?.amount,
      transactionId: result.transactionId ?? order?.transactionId,
    });
  } catch (err) {
    next(err);
  }
}
