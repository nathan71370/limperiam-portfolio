import "server-only";

export const COOKIE_NAME = "access_token";

/**
 * Parse a `Set-Cookie` response header from the API and extract the JWT value.
 * Returns null if not present.
 */
export function extractAccessToken(
  setCookieHeader: string | null,
): string | null {
  if (!setCookieHeader) return null;
  // Set-Cookie can contain multiple cookies (comma-separated only when JS Set-Cookie is joined)
  // But fetch().headers.get() joins them with comma. We split by ", " then look for our cookie.
  // Safer: use regex to find access_token=<value>
  const match = setCookieHeader.match(/(?:^|[,;]\s*)access_token=([^;]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}
