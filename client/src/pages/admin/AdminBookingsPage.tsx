import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Booking, Service, Staff } from "../../api/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminBookingsPage() {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => api.get<{ bookings: Booking[] }>("/admin/bookings"),
  });

  const staffQuery = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => api.get<{ staff: Staff[] }>("/admin/staff"),
  });

  const servicesQuery = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => api.get<{ services: Service[] }>("/admin/services"),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) =>
      api.patch<{ booking: Booking }>(`/admin/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
  });

  const staffById = new Map((staffQuery.data?.staff ?? []).map((s) => [s.id, s]));
  const serviceById = new Map((servicesQuery.data?.services ?? []).map((s) => [s.id, s]));

  return (
    <div>
      {bookingsQuery.isLoading && <p className="hint">Loading...</p>}
      {bookingsQuery.data?.bookings.length === 0 && (
        <p className="empty-state">No bookings yet.</p>
      )}
      <ul className="booking-list">
        {bookingsQuery.data?.bookings.map((booking) => {
          const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING";
          return (
            <li key={booking.id} className={`booking-item status-${booking.status.toLowerCase()}`}>
              <div className="booking-item-main">
                <strong>{serviceById.get(booking.serviceId)?.name ?? "Service"}</strong>
                <span> with {staffById.get(booking.staffId)?.name ?? "Staff"}</span>
              </div>
              <div className="booking-item-time">{formatDateTime(booking.startTime)}</div>
              <span className="status-badge">{booking.status}</span>
              {canCancel && (
                <button
                  type="button"
                  onClick={() => cancelMutation.mutate(booking.id)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
