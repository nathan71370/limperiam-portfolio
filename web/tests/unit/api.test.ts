import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiGet, apiPost, ApiError } from "@/lib/api";

describe("apiGet", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on 200", async () => {
    global.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const res = await apiGet<{ ok: boolean }>("/foo");
    expect(res).toEqual({ ok: true });
  });

  it("throws ApiError on non-2xx", async () => {
    global.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "bad" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
    );
    await expect(apiGet("/foo")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("apiPost", () => {
  it("posts JSON body", async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: 1 }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
    );
    global.fetch = fetchSpy as typeof global.fetch;
    await apiPost("/bar", { hello: "world" });
    expect(fetchSpy).toHaveBeenCalled();
    const call = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const init = call[1];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ hello: "world" }));
  });
});
