import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./env.js";
import paymentsRouter from "./payments.routes.js";
import contactRouter from "./contact.routes.js";
import { notFoundHandler, errorHandler } from "./errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/payments", paymentsRouter);
  app.use("/api/contact", contactRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
