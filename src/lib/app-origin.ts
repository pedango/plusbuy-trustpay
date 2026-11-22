/** Origin the browser used for this request. Keeps the host so session cookies still match. */
export function browserOrigin(request: Request, fallback: string): string {
  const rawHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!rawHost) return fallback.replace(/\/$/, "");
  const host = rawHost.split(",")[0]?.trim() || rawHost;
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwarded || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Same origin, but `localhost` is rewritten to `127.0.0.1`.
 * Node fetch to `localhost` on Windows can fail with ECONNREFUSED when only IPv4 is listening.
 */
export function loopbackOrigin(origin: string): string {
  return origin.replace("://localhost", "://127.0.0.1");
}
