import type { EventRecord } from "@/lib/types";

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
    timeZone: "Europe/London",
  }).format(start);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(start);
  if (!endsAt) return `${date} · ${time} Europe/London`;
  const endTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(endsAt));
  return `${date} · ${time}–${endTime} Europe/London`;
}

export function groupEventsByMonth(events: EventRecord[]) {
  const groups = new Map<string, EventRecord[]>();
  for (const event of events) {
    const key = new Intl.DateTimeFormat("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "Europe/London",
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
