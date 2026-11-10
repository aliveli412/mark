import { getPublishedEvent } from "@/lib/data/catalog";
import { buildIcsEvent } from "@/lib/calendar-links";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const event = await getPublishedEvent(slug);
  if (!event) {
    return new Response("Event not found", { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const pageUrl = `${origin}/calendar/${event.slug || event.id}`;
  const body = buildIcsEvent(event, pageUrl);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug || event.id}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
