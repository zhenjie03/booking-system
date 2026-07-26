import cors from "cors";
import express from "express";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import availabilityRouter from "./routes/availability";
import bookingsRouter from "./routes/bookings";
import staffRouter from "./routes/staff";

export const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", authRouter);
app.use("/api", availabilityRouter);
app.use("/api", bookingsRouter);
app.use("/api", adminRouter);
app.use("/api", staffRouter);
