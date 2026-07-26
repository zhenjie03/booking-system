import { Router } from "express";
import { z } from "zod";
import { generateAvailableSlots } from "../services/availability";

const router = Router();

const querySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

router.get("/staff/:staffId/slots", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { staffId } = req.params;
  const { serviceId, date } = parsed.data;

  try {
    const slots = await generateAvailableSlots(staffId, serviceId, parseLocalDate(date));
    res.json({ slots });
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
