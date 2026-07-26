import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Booking, Service, Staff } from "../api/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyBookingsPage() {
  const bookingsQuery = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => api.get<{ bookings: Booking[] }>("/bookings/me"),
  });

  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => api.get<{ staff: Staff[] }>("/staff"),
  });

  const servicesQuery = useQuery({
    queryKey: ["all-services"],
    queryFn: () => api.get<{ services: Service[] }>("/services"),
  });

  const staffById = new Map((staffQuery.data?.staff ?? []).map((s) => [s.id, s]));
  const serviceById = new Map((servicesQuery.data?.services ?? []).map((s) => [s.id, s]));

  return (
    <div className="my-bookings-page">
      <h1>My Bookings</h1>
      {bookingsQuery.isLoading && <p className="hint">Loading...</p>}
      {bookingsQuery.data?.bookings.length === 0 && (
        <p className="empty-state">You have no bookings yet.</p>
      )}
      <ul className="booking-list">
        {bookingsQuery.data?.bookings.map((booking) => (
          <li key={booking.id} className={`booking-item status-${booking.status.toLowerCase()}`}>
            <div className="booking-item-main">
              <strong>{serviceById.get(booking.serviceId)?.name ?? "Service"}</strong>
              <span> with {staffById.get(booking.staffId)?.name ?? "Staff"}</span>
            </div>
            <div className="booking-item-time">{formatDateTime(booking.startTime)}</div>
            <span className="status-badge">{booking.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
