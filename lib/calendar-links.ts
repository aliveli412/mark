import type { EventRecord } from "@/lib/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** UTC stamp for ICS: 20260518T100000Z */
export function toIcsUtc(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function icsEscape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function googleStamp(iso: string) {
  return toIcsUtc(iso).replace(/Z$/, "");
}

export function eventLocationLine(event: Pick<EventRecord, "location" | "address">) {
  return [event.location, event.address].filter(Boolean).join(", ");
}

export function googleCalendarUrl(event: EventRecord, pageUrl?: string) {
  const end = event.ends_at || event.starts_at;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${googleStamp(event.starts_at)}/${googleStamp(end)}`,
    details: [event.summary, event.body, pageUrl].filter(Boolean).join("\n\n"),
    location: eventLocationLine(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: EventRecord, pageUrl?: string) {
  const end = event.ends_at || event.starts_at;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: new Date(event.starts_at).toISOString(),
    enddt: new Date(end).toISOString(),
    body: [event.summary, event.body, pageUrl].filter(Boolean).join("\n\n"),
    location: eventLocationLine(event),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function mapsDirectionsUrl(event: Pick<EventRecord, "location" | "address">) {
  const query = eventLocationLine(event);
  if (!query) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

export function buildIcsEvent(event: EventRecord, pageUrl?: string) {
  const end = event.ends_at || event.starts_at;
  const uid = `${event.id}@mark-master-masons`;
  const description = [event.summary, event.body, pageUrl].filter(Boolean).join("\n\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mark Master Masons//Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(event.starts_at)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(eventLocationLine(event))}`,
    pageUrl ? `URL:${pageUrl}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return `${lines.join("\r\n")}\r\n`;
}

export function buildIcsFeed(events: EventRecord[], siteOrigin: string) {
  const vevents = events.flatMap((event) => {
    const end = event.ends_at || event.starts_at;
    const pageUrl = `${siteOrigin}/calendar/${event.slug || event.id}`;
    const description = [event.summary, event.body, pageUrl].filter(Boolean).join("\n\n");
    return [
      "BEGIN:VEVENT",
      `UID:${event.id}@mark-master-masons`,
      `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
      `DTSTART:${toIcsUtc(event.starts_at)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:${icsEscape(event.title)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      `LOCATION:${icsEscape(eventLocationLine(event))}`,
      `URL:${pageUrl}`,
      "END:VEVENT",
    ];
  });

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mark Master Masons//Portal//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...vevents, "END:VCALENDAR", ""].join(
    "\r\n",
  );
}
