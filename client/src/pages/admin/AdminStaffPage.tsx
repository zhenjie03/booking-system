import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../api/client";
import type { Staff } from "../../api/types";

export function AdminStaffPage() {
  const queryClient = useQueryClient();
  const staffQuery = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => api.get<{ staff: Staff[] }>("/admin/staff"),
  });

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => api.post<{ staff: Staff }>("/admin/staff", { name, bio: bio || undefined }),
    onSuccess: () => {
      setName("");
      setBio("");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Failed to create staff"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<{ staff: Staff }>(`/admin/staff/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <div>
      <div className="card">
        <h2>New staff member</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Bio
            <input value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            Add staff
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <ul className="admin-list">
        {staffQuery.data?.staff.map((s) => (
          <li key={s.id} className="admin-list-item">
            <div>
              <Link to={`/admin/staff/${s.id}`}>
                <strong>{s.name}</strong>
              </Link>
              {!s.isActive && <span className="status-badge"> inactive</span>}
            </div>
            <button
              type="button"
              onClick={() => toggleActiveMutation.mutate({ id: s.id, isActive: !s.isActive })}
              disabled={toggleActiveMutation.isPending}
            >
              {s.isActive ? "Deactivate" : "Activate"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
