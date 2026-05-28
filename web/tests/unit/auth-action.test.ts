import { describe, expect, it } from "vitest";
import { extractAccessToken } from "@/lib/auth-cookie";

describe("extractAccessToken", () => {
  it("returns null when header is null", () => {
    expect(extractAccessToken(null)).toBeNull();
  });

  it("returns null when no access_token cookie present", () => {
    expect(extractAccessToken("other=value; Path=/")).toBeNull();
  });

  it("extracts the token when present at start", () => {
    expect(
      extractAccessToken(
        "access_token=eyJabc.def; HttpOnly; Path=/; SameSite=Lax",
      ),
    ).toBe("eyJabc.def");
  });

  it("extracts the token when present after a semicolon", () => {
    expect(
      extractAccessToken(
        "Path=/; access_token=token123; HttpOnly",
      ),
    ).toBe("token123");
  });

  it("extracts the token when joined by comma (multiple Set-Cookie)", () => {
    // fetch().headers.get('set-cookie') often joins multiple cookies with ", "
    expect(
      extractAccessToken(
        "other=value; Path=/, access_token=jwt.payload.sig; HttpOnly; Path=/",
      ),
    ).toBe("jwt.payload.sig");
  });

  it("URL-decodes the token", () => {
    expect(
      extractAccessToken("access_token=jwt%20with%20spaces; Path=/"),
    ).toBe("jwt with spaces");
  });
});
