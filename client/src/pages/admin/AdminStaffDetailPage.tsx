import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client";
import type { Service, Staff, WeeklyAvailabilityWindow } from "../../api/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

type DayRow = { enabled: boolean; start: string; end: string };

export function AdminStaffDetailPage() {
  const { staffId } = useParams<{ staffId: string }>();
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => api.get<{ staff: Staff[] }>("/admin/staff"),
  });
  const staffMember = staffQuery.data?.staff.find((s) => s.id === staffId);

  const servicesQuery = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => api.get<{ services: Service[] }>("/admin/services"),
  });

  const assignedQuery = useQuery({
    queryKey: ["admin-staff-services", staffId],
    queryFn: () => api.get<{ serviceIds: string[] }>(`/admin/staff/${staffId}/services`),
    enabled: !!staffId,
  });

  const availabilityQuery = useQuery({
    queryKey: ["admin-staff-availability", staffId],
    queryFn: () =>
      api.get<{ availability: WeeklyAvailabilityWindow[] }>(
        `/admin/staff/${staffId}/availability`,
      ),
    enabled: !!staffId,
  });

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [days, setDays] = useState<DayRow[]>(
    DAY_NAMES.map(() => ({ enabled: false, start: "09:00", end: "17:00" })),
  );

  useEffect(() => {
    if (assignedQuery.data) {
      setSelectedServiceIds(new Set(assignedQuery.data.serviceIds));
    }
  }, [assignedQuery.data]);

  useEffect(() => {
    if (availabilityQuery.data) {
      const byDay = new Map(availabilityQuery.data.availability.map((w) => [w.dayOfWeek, w]));
      setDays(
        DAY_NAMES.map((_, dayOfWeek) => {
          const w = byDay.get(dayOfWeek);
          return w
            ? { enabled: true, start: minutesToHHMM(w.startMinute), end: minutesToHHMM(w.endMinute) }
            : { enabled: false, start: "09:00", end: "17:00" };
        }),
      );
    }
  }, [availabilityQuery.data]);

  const saveServicesMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/staff/${staffId}/services`, { serviceIds: Array.from(selectedServiceIds) }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-staff-services", staffId] }),
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: () => {
      const windows = days
        .map((d, dayOfWeek) => ({ ...d, dayOfWeek }))
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startMinute: hhmmToMinutes(d.start),
          endMinute: hhmmToMinutes(d.end),
        }));
      return api.put(`/admin/staff/${staffId}/availability`, { windows });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-staff-availability", staffId] }),
  });

  function toggleService(id: string) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateDay(index: number, patch: Partial<DayRow>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  return (
    <div>
      <h2>{staffMember?.name ?? "Staff"}</h2>

      <div className="card">
        <h3>Services offered</h3>
        <div className="checkbox-list">
          {servicesQuery.data?.services.map((service) => (
            <label key={service.id} className="checkbox-row">
              <input
                type="checkbox"
                checked={selectedServiceIds.has(service.id)}
                onChange={() => toggleService(service.id)}
              />
              {service.name} ({service.durationMinutes} min)
            </label>
          ))}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => saveServicesMutation.mutate()}
          disabled={saveServicesMutation.isPending}
        >
          Save services
        </button>
      </div>

      <div className="card">
        <h3>Weekly availability</h3>
        <div className="availability-grid">
          {DAY_NAMES.map((dayName, index) => {
            const day = days[index];
            return (
              <div key={dayName} className="availability-row">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay(index, { enabled: e.target.checked })}
                  />
                  {dayName}
                </label>
                <input
                  type="time"
                  value={day.start}
                  disabled={!day.enabled}
                  onChange={(e) => updateDay(index, { start: e.target.value })}
                />
                <span>to</span>
                <input
                  type="time"
                  value={day.end}
                  disabled={!day.enabled}
                  onChange={(e) => updateDay(index, { end: e.target.value })}
                />
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => saveAvailabilityMutation.mutate()}
          disabled={saveAvailabilityMutation.isPending}
        >
          Save availability
        </button>
      </div>
    </div>
  );
}
