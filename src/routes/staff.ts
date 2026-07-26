import { eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import { services, staff, staffServices } from "../db/schema";

const router = Router();

router.get("/staff", async (_req, res) => {
  const activeStaff = await db.query.staff.findMany({
    where: eq(staff.isActive, true),
  });
  res.json({ staff: activeStaff });
});

router.get("/services", async (_req, res) => {
  const activeServices = await db.query.services.findMany({
    where: eq(services.isActive, true),
  });
  res.json({ services: activeServices });
});

router.get("/staff/:staffId/services", async (req, res) => {
  const { staffId } = req.params;
  const rows = await db
    .select({ service: services })
    .from(staffServices)
    .innerJoin(services, eq(staffServices.serviceId, services.id))
    .where(eq(staffServices.staffId, staffId));

  res.json({ services: rows.map((r) => r.service).filter((s) => s.isActive) });
});

export default router;
