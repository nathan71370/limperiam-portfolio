export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : `API error ${status}`);
    this.name = "ApiError";
  }
}

const API_BASE = process.env.API_URL || "http://api:8000";
const API_PREFIX = "/api/v1";

function url(path: string): string {
  return `${API_BASE}${API_PREFIX}${path}`;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}

export async function apiGet<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    method: "GET",
    headers: { Accept: "application/json", ...(init.headers || {}) },
  });
  return parseResponse<T>(res);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res);
}
