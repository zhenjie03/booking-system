import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { api, ApiError } from "../api/client";
import type { Booking, Service, Slot, Staff } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "../context/AuthModalContext";

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type FeedbackState = { message: string; kind: "success" | "warning" | "error" } | null;

export function BookingPage() {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const queryClient = useQueryClient();
  const [staffId, setStaffId] = useState<string>("");
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => api.get<{ staff: Staff[] }>("/staff"),
  });

  const servicesQuery = useQuery({
    queryKey: ["services", staffId],
    queryFn: () => api.get<{ services: Service[] }>(`/staff/${staffId}/services`),
    enabled: !!staffId,
  });

  const dateKey = date ? toLocalDateKey(date) : undefined;

  const slotsQuery = useQuery({
    queryKey: ["slots", staffId, serviceId, dateKey],
    queryFn: () =>
      api.get<{ slots: Slot[] }>(`/staff/${staffId}/slots?serviceId=${serviceId}&date=${dateKey}`),
    enabled: !!staffId && !!serviceId && !!dateKey,
  });

  const bookMutation = useMutation({
    mutationFn: (slot: Slot) =>
      api.post<{ booking: Booking }>("/bookings", { staffId, serviceId, startTime: slot.start }),
    onSuccess: () => {
      setFeedback({ message: "Booked! Check My Bookings to see it.", kind: "success" });
      queryClient.invalidateQueries({ queryKey: ["slots", staffId, serviceId, dateKey] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setFeedback({ message: "That slot was just taken — pick another one.", kind: "warning" });
        queryClient.invalidateQueries({ queryKey: ["slots", staffId, serviceId, dateKey] });
      } else {
        setFeedback({
          message: err instanceof ApiError ? err.message : "Booking failed",
          kind: "error",
        });
      }
    },
  });

  return (
    <div className="booking-page">
      <h1>Book an appointment</h1>

      <div className="field-row">
        <label>
          Staff
          <select
            value={staffId}
            onChange={(e) => {
              setStaffId(e.target.value);
              setServiceId("");
              setFeedback(null);
            }}
          >
            <option value="">Select staff...</option>
            {staffQuery.data?.staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Service
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setFeedback(null);
            }}
            disabled={!staffId}
          >
            <option value="">Select service...</option>
            {servicesQuery.data?.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min, ${s.price})
              </option>
            ))}
          </select>
        </label>
      </div>

      {staffId && serviceId && (
        <div className="booking-body">
          <div className="card">
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setFeedback(null);
              }}
              disabled={{ before: new Date() }}
            />
          </div>

          <div className="card slots-card">
            <h2>Available times</h2>
            {!date && <p className="hint">Pick a date to see available times.</p>}
            {date && slotsQuery.isLoading && <p className="hint">Loading slots...</p>}
            {date && slotsQuery.data?.slots.length === 0 && (
              <p className="slots-empty">No available slots this day.</p>
            )}
            {date && slotsQuery.data && slotsQuery.data.slots.length > 0 && (
              <div className="slots">
                {slotsQuery.data.slots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    className="slot-button"
                    disabled={bookMutation.isPending}
                    onClick={() => {
                      setFeedback(null);
                      if (!user) {
                        openLogin({ dismissable: true });
                        return;
                      }
                      bookMutation.mutate(slot);
                    }}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {feedback && <p className={`feedback ${feedback.kind !== "success" ? feedback.kind : ""}`}>{feedback.message}</p>}
    </div>
  );
}
