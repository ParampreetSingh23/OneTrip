// Pure: where to go after sign-in. Only same-origin paths; anything a browser would resolve to
// another site (//x, /\x, /\t/x, absolute URLs) falls back to the dashboard.
export function safeNext(raw: string | null, origin: string, fallback = "/dashboard") {
  if (!raw || !raw.startsWith("/")) return fallback;
  try {
    const u = new URL(raw, origin);
    return u.origin === origin ? u.pathname + u.search + u.hash : fallback;
  } catch {
    return fallback;
  }
}
