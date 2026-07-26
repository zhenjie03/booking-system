import { and, eq, gt, lt, ne } from "drizzle-orm";
import { db } from "../db";
import { bookings, services, weeklyAvailability } from "../db/schema";
import { computeCandidateSlots, filterAvailableSlots, type Slot } from "./slotAlgorithm";

export type { Slot };

export async function generateAvailableSlots(
  staffId: string,
  serviceId: string,
  date: Date,
): Promise<Slot[]> {
  const service = await db.query.services.findFirst({
    where: eq(services.id, serviceId),
  });
  if (!service) throw new Error(`Service ${serviceId} not found`);

  const dayOfWeek = date.getDay();
  const windows = await db.query.weeklyAvailability.findMany({
    where: and(
      eq(weeklyAvailability.staffId, staffId),
      eq(weeklyAvailability.dayOfWeek, dayOfWeek),
    ),
  });

  const candidates = computeCandidateSlots(
    windows,
    date,
    service.durationMinutes,
    service.bufferMinutes,
  );

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const existingBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.staffId, staffId),
      ne(bookings.status, "CANCELLED"),
      lt(bookings.startTime, dayEnd),
      gt(bookings.endTime, dayStart),
    ),
  });

  return filterAvailableSlots(
    candidates,
    existingBookings.map((b) => ({ start: b.startTime, end: b.endTime })),
    service.bufferMinutes,
    service.minNoticeMinutes,
    new Date(),
  );
}
