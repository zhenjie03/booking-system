import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api, ApiError } from "../../api/client";
import type { Service } from "../../api/types";

export function AdminServicesPage() {
  const queryClient = useQueryClient();
  const servicesQuery = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => api.get<{ services: Service[] }>("/admin/services"),
  });

  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [minNoticeMinutes, setMinNoticeMinutes] = useState(60);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<{ service: Service }>("/admin/services", {
        name,
        durationMinutes,
        bufferMinutes,
        minNoticeMinutes,
        price,
      }),
    onSuccess: () => {
      setName("");
      setPrice("");
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Failed to create service"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<{ service: Service }>(`/admin/services/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-services"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <div>
      <div className="card">
        <h2>New service</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Duration (min)
            <input
              type="number"
              min={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Buffer (min)
            <input
              type="number"
              min={0}
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
            />
          </label>
          <label>
            Min notice (min)
            <input
              type="number"
              min={0}
              value={minNoticeMinutes}
              onChange={(e) => setMinNoticeMinutes(Number(e.target.value))}
            />
          </label>
          <label>
            Price
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50.00" required />
          </label>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            Add service
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <ul className="admin-list">
        {servicesQuery.data?.services.map((service) => (
          <li key={service.id} className="admin-list-item">
            <div>
              <strong>{service.name}</strong>
              <span className="hint">
                {" "}
                — {service.durationMinutes} min, ${service.price}, buffer {service.bufferMinutes}
                min, notice {service.minNoticeMinutes}min
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                toggleActiveMutation.mutate({ id: service.id, isActive: !service.isActive })
              }
              disabled={toggleActiveMutation.isPending}
            >
              {service.isActive ? "Deactivate" : "Activate"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
