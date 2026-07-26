export type Role = "CLIENT" | "ADMIN";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type Staff = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  isActive: boolean;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  minNoticeMinutes: number;
  price: string;
  isActive: boolean;
};

export type Slot = {
  start: string;
  end: string;
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type Booking = {
  id: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
};

export type WeeklyAvailabilityWindow = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};
