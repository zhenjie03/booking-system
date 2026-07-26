import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { bookings, services } from "../db/schema";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/bookings/me", authenticate, async (req, res) => {
  const myBookings = await db.query.bookings.findMany({
    where: eq(bookings.clientId, req.user!.sub),
    orderBy: desc(bookings.startTime),
  });
  res.json({ bookings: myBookings });
});

const createBookingSchema = z.object({
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  startTime: z.iso.datetime(),
});

router.post("/bookings", authenticate, async (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { staffId, serviceId, startTime } = parsed.data;
  const clientId = req.user!.sub;

  const service = await db.query.services.findFirst({ where: eq(services.id, serviceId) });
  if (!service) {
    return res.status(404).json({ error: `Service ${serviceId} not found` });
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + service.durationMinutes * 60 * 1000);

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        clientId,
        staffId,
        serviceId,
        startTime: start,
        endTime: end,
        status: "CONFIRMED",
      })
      .returning();
    res.status(201).json({ booking });
  } catch (err: any) {
    if (err?.cause?.constraint === "no_overlapping_bookings") {
      return res.status(409).json({ error: "This time slot is no longer available." });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
