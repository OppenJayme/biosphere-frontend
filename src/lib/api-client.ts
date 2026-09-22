import "server-only";
import { getAccessToken } from "@/lib/session";
import { env } from "@/lib/env";

// Server-side only: lets the API_URL differ from the public one (e.g. an
// internal Docker Compose service name) without exposing it to the client.
const API_URL = process.env.API_URL ?? env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init?.headers);

  // Let fetch generate the multipart boundary; forcing JSON here corrupts file uploads.
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }

  return res.json();
}
