const FORWARDED_HEADERS = [
  "authorization",
  "x-tenant-id",
  "x-forwarded-for",
  "x-real-ip",
  "x-request-id",
] as const;

export function forwardHeaders(request?: Request): Record<string, string> {
  if (!request) return {};

  const forwarded: Record<string, string> = {};
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) forwarded[name] = value;
  }
  return forwarded;
}
