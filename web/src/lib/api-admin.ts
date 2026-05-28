import "server-only";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api";
import { COOKIE_NAME } from "@/lib/auth-cookie";

const API_BASE = process.env.API_URL || "http://api:8000";
const API_PREFIX = "/api/v1";

function url(path: string): string {
  return `${API_BASE}${API_PREFIX}${path}`;
}

async function buildHeaders(extra: HeadersInit = {}): Promise<Headers> {
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    // Forward as a Cookie header so the API's get_current_admin dep can read it
    headers.set("Cookie", `${COOKIE_NAME}=${token}`);
  }
  return headers;
}

async function parse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export async function apiAdminGet<T>(path: string): Promise<T> {
  const res = await fetch(url(path), {
    method: "GET",
    headers: await buildHeaders(),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "POST",
    headers: await buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "PUT",
    headers: await buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "PATCH",
    headers: await buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminDelete(path: string): Promise<void> {
  const res = await fetch(url(path), {
    method: "DELETE",
    headers: await buildHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();
    throw new ApiError(res.status, body);
  }
}

/** Upload a single file via multipart/form-data. */
export async function apiAdminUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url(path), {
    method: "POST",
    headers: await buildHeaders(), // no Content-Type — fetch sets multipart boundary
    body: form,
    cache: "no-store",
  });
  return parse<T>(res);
}
