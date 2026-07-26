import { db } from "./index";
import { services, staff, staffServices, weeklyAvailability } from "./schema";

async function main() {
  const [stylist] = await db
    .insert(staff)
    .values({ name: "Demo Stylist", bio: "Seed data for local testing" })
    .returning();

  const [haircut] = await db
    .insert(services)
    .values({
      name: "Haircut",
      durationMinutes: 45,
      bufferMinutes: 10,
      minNoticeMinutes: 60,
      price: "50.00",
    })
    .returning();

  const [coloring] = await db
    .insert(services)
    .values({
      name: "Hair Coloring",
      durationMinutes: 90,
      bufferMinutes: 15,
      minNoticeMinutes: 120,
      price: "120.00",
    })
    .returning();

  await db.insert(staffServices).values([
    { staffId: stylist.id, serviceId: haircut.id },
    { staffId: stylist.id, serviceId: coloring.id },
  ]);

  // Monday-Friday 9:00-17:00 (540-1020 minutes)
  await db.insert(weeklyAvailability).values(
    [1, 2, 3, 4, 5].map((dayOfWeek) => ({
      staffId: stylist.id,
      dayOfWeek,
      startMinute: 540,
      endMinute: 1020,
    })),
  );

  console.log("Seeded:");
  console.log({ staffId: stylist.id, haircutServiceId: haircut.id, coloringServiceId: coloring.id });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
