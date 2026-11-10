import type { EventRecord } from "@/lib/types";

const tz = "Europe/London";

export function formatPence(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function formatEventWhen(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt);
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
  }).format(start);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(start);
  if (!endsAt) return `${date} @ ${time}`;
  const endTime = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  }).format(new Date(endsAt));
  return `${date} @ ${time} – ${endTime}`;
}

export function eventDateParts(startsAt: string) {
  const date = new Date(startsAt);
  return {
    month: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: tz }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: tz }).format(date),
    weekday: new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: tz }).format(date),
    time: new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    }).format(date),
  };
}

export function groupEventsByMonth(events: EventRecord[]) {
  const groups = new Map<string, EventRecord[]>();
  for (const event of events) {
    const key = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: tz,
    }).format(new Date(event.starts_at));
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

export function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function eventHref(event: Pick<EventRecord, "id" | "slug">) {
  return `/calendar/${event.slug || event.id}`;
}
