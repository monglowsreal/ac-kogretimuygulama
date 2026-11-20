import { NextRequest } from "next/server";

export function isLocalDiskSyncAllowed(req: NextRequest): boolean {
  if (
    process.env.VERCEL ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER ||
    process.env.DISABLE_LOCAL_STATE_API === "1"
  ) {
    return false;
  }

  const host = (req.headers.get("host") || "").toLowerCase();
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
  );
}
