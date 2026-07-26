import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../src/app";
import { db } from "../../src/db";
import { bookings, services, staff, users, weeklyAvailability } from "../../src/db/schema";

function nextMonday(): Date {
  const date = new Date();
  const daysUntilMonday = (1 + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

// The API's `date` query param is parsed as a local calendar date, so it must be
// formatted from local Y/M/D components — toISOString() would shift across the
// UTC boundary and silently land on the wrong day depending on the server's timezone.
function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("bookings API", () => {
  let staffId: string;
  let serviceId: string;
  let clientUserId: string;
  let clientToken: string;
  const dateKey = toDateKey(nextMonday());

  beforeAll(async () => {
    const [createdStaff] = await db
      .insert(staff)
      .values({ name: "Integration Test Stylist" })
      .returning();
    staffId = createdStaff.id;

    const [createdService] = await db
      .insert(services)
      .values({
        name: "Integration Test Service",
        durationMinutes: 30,
        bufferMinutes: 5,
        minNoticeMinutes: 0,
        price: "10.00",
      })
      .returning();
    serviceId = createdService.id;

    await db.insert(weeklyAvailability).values({
      staffId,
      dayOfWeek: 1, // Monday
      startMinute: 540,
      endMinute: 600, // 9:00-10:00, just enough for a couple of slots
    });

    const email = `booking-test-${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "correct-horse-1", name: "Integration Test Client" });
    clientToken = registerRes.body.token;
    clientUserId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await db.delete(bookings).where(eq(bookings.staffId, staffId));
    await db.delete(weeklyAvailability).where(eq(weeklyAvailability.staffId, staffId));
    await db.delete(staff).where(eq(staff.id, staffId));
    await db.delete(services).where(eq(services.id, serviceId));
    await db.delete(users).where(eq(users.id, clientUserId));
  });

  it("returns candidate slots for the configured availability window", async () => {
    const res = await request(app).get(
      `/api/staff/${staffId}/slots?serviceId=${serviceId}&date=${dateKey}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it("books the first available slot", async () => {
    const slotsRes = await request(app).get(
      `/api/staff/${staffId}/slots?serviceId=${serviceId}&date=${dateKey}`,
    );
    const firstSlot = slotsRes.body.slots[0];

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ staffId, serviceId, startTime: firstSlot.start });

    expect(res.status).toBe(201);
    expect(res.body.booking.status).toBe("CONFIRMED");
  });

  it("rejects a second booking for the exact same slot with 409, enforced by the DB constraint", async () => {
    const slotsRes = await request(app).get(
      `/api/staff/${staffId}/slots?serviceId=${serviceId}&date=${dateKey}`,
    );
    // the previously booked slot no longer shows up, so re-request its exact start time directly
    const bookedStart = new Date(nextMonday().getTime() + 540 * 60 * 1000).toISOString();

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${clientToken}`)
      .send({ staffId, serviceId, startTime: bookedStart });

    expect(res.status).toBe(409);
    expect(slotsRes.body.slots.find((s: { start: string }) => s.start === bookedStart)).toBeUndefined();
  });
});
