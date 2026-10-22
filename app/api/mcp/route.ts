import { env } from "cloudflare:workers";
import { createBookingStore } from "@/lib/booking.mjs";
import { handleMcp } from "@/lib/clinic-mcp.mjs";

function handle(request: Request) {
  const origins = ["https://clinic-access-navigator.janrusabello.chatgpt.site"];
  if (process.env.NODE_ENV !== "production") origins.push("http://terminal.local:4173");
  return handleMcp(request, origins, env.DB ? createBookingStore(env.DB) : undefined);
}
export const POST = handle;
export const GET = handle;
export const DELETE = handle;
