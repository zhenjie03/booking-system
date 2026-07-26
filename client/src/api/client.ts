const API_URL = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      body && typeof body === "object" && "error" in body
        ? extractErrorMessage((body as { error: unknown }).error)
        : `Request failed with status ${status}`;
    super(message);
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "formErrors" in error) {
    const flat = error as { formErrors: string[]; fieldErrors: Record<string, string[]> };
    return flat.formErrors[0] ?? Object.values(flat.fieldErrors).flat()[0] ?? "Validation error";
  }
  return "Request failed";
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = res.headers.get("content-type");
  const body = contentType?.includes("application/json") ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
};
