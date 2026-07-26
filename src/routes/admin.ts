import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { bookings, services, staff, staffServices, weeklyAvailability } from "../db/schema";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// ---------- bookings ----------

router.get("/admin/bookings", async (_req, res) => {
  const allBookings = await db.query.bookings.findMany({
    orderBy: desc(bookings.startTime),
  });
  res.json({ bookings: allBookings });
});

router.patch("/admin/bookings/:id/cancel", async (req, res) => {
  const [booking] = await db
    .update(bookings)
    .set({ status: "CANCELLED" })
    .where(eq(bookings.id, req.params.id))
    .returning();
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }
  res.json({ booking });
});

// ---------- staff ----------

router.get("/admin/staff", async (_req, res) => {
  const allStaff = await db.query.staff.findMany();
  res.json({ staff: allStaff });
});

const createStaffSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
});

router.post("/admin/staff", async (req, res) => {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const [created] = await db.insert(staff).values(parsed.data).returning();
  res.status(201).json({ staff: created });
});

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.patch("/admin/staff/:id", async (req, res) => {
  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const [updated] = await db
    .update(staff)
    .set(parsed.data)
    .where(eq(staff.id, req.params.id))
    .returning();
  if (!updated) {
    return res.status(404).json({ error: "Staff not found" });
  }
  res.json({ staff: updated });
});

// ---------- services ----------

router.get("/admin/services", async (_req, res) => {
  const allServices = await db.query.services.findMany();
  res.json({ services: allServices });
});

const createServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  bufferMinutes: z.number().int().min(0).optional(),
  minNoticeMinutes: z.number().int().min(0).optional(),
  price: z.string().min(1),
});

router.post("/admin/services", async (req, res) => {
  const parsed = createServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const [created] = await db.insert(services).values(parsed.data).returning();
  res.status(201).json({ service: created });
});

const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  bufferMinutes: z.number().int().min(0).optional(),
  minNoticeMinutes: z.number().int().min(0).optional(),
  price: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

router.patch("/admin/services/:id", async (req, res) => {
  const parsed = updateServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const [updated] = await db
    .update(services)
    .set(parsed.data)
    .where(eq(services.id, req.params.id))
    .returning();
  if (!updated) {
    return res.status(404).json({ error: "Service not found" });
  }
  res.json({ service: updated });
});

// ---------- staff <-> service assignment ----------

router.get("/admin/staff/:staffId/services", async (req, res) => {
  const rows = await db.query.staffServices.findMany({
    where: eq(staffServices.staffId, req.params.staffId),
  });
  res.json({ serviceIds: rows.map((r) => r.serviceId) });
});

const replaceServicesSchema = z.object({
  serviceIds: z.array(z.string().min(1)),
});

router.put("/admin/staff/:staffId/services", async (req, res) => {
  const parsed = replaceServicesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { staffId } = req.params;
  const { serviceIds } = parsed.data;

  await db.transaction(async (tx) => {
    await tx.delete(staffServices).where(eq(staffServices.staffId, staffId));
    if (serviceIds.length > 0) {
      await tx
        .insert(staffServices)
        .values(serviceIds.map((serviceId) => ({ staffId, serviceId })));
    }
  });

  res.json({ staffId, serviceIds });
});

// ---------- weekly availability ----------

router.get("/admin/staff/:staffId/availability", async (req, res) => {
  const rows = await db.query.weeklyAvailability.findMany({
    where: eq(weeklyAvailability.staffId, req.params.staffId),
  });
  res.json({ availability: rows });
});

const replaceAvailabilitySchema = z.object({
  windows: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startMinute: z.number().int().min(0).max(1440),
      endMinute: z.number().int().min(0).max(1440),
    }),
  ),
});

router.put("/admin/staff/:staffId/availability", async (req, res) => {
  const parsed = replaceAvailabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { staffId } = req.params;
  const { windows } = parsed.data;

  for (const w of windows) {
    if (w.endMinute <= w.startMinute) {
      return res.status(400).json({ error: "endMinute must be after startMinute" });
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(weeklyAvailability).where(eq(weeklyAvailability.staffId, staffId));
    if (windows.length > 0) {
      await tx.insert(weeklyAvailability).values(windows.map((w) => ({ staffId, ...w })));
    }
  });

  res.json({ staffId, windows });
});

export default router;
