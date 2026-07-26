import {
  pgTable,
  pgEnum,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["CLIENT", "ADMIN"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("CLIENT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const staff = pgTable("staff", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable("services", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  bufferMinutes: integer("buffer_minutes").notNull().default(10),
  minNoticeMinutes: integer("min_notice_minutes").notNull().default(60),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const staffServices = pgTable(
  "staff_services",
  {
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
  },
  (t) => [primaryKey({ columns: [t.staffId, t.serviceId] })],
);

export const weeklyAvailability = pgTable(
  "weekly_availability",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday ... 6 = Saturday
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (t) => [index("weekly_availability_staff_day_idx").on(t.staffId, t.dayOfWeek)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id")
      .notNull()
      .references(() => users.id),
    staffId: text("staff_id")
      .notNull()
      .references(() => staff.id),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: bookingStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bookings_staff_start_idx").on(t.staffId, t.startTime)],
);
