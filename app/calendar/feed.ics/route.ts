import { listPublishedEvents } from "@/lib/data/catalog";
import { buildIcsFeed } from "@/lib/calendar-links";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const events = await listPublishedEvents();
  const origin = new URL(request.url).origin;
  const body = buildIcsFeed(events, origin);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="mark-events.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
