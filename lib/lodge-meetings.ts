import type { LodgeEvent, MarkSite } from "@/lib/mark-sites";
import { lodgePath } from "@/lib/mark-sites";
import type { EventRecord } from "@/lib/types";

const UPCOMING_GRACE_MS = 6 * 60 * 60 * 1000;

export type LodgeMeetingListItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  startsAt: string;
  endsAt: string;
  location: string;
  attendanceNote: string;
  rsvpOpen: boolean;
  href: string;
  rsvpHref: string;
};

export function eventDateLabel(startsAt: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/London",
  })
    .format(new Date(startsAt))
    .replace(",", "")
    .toUpperCase();
}

export function eventToLodgeEvent(event: EventRecord, fallbackNote?: string): LodgeEvent {
  const endsAt = event.ends_at || event.starts_at;
  return {
    dateLabel: eventDateLabel(event.starts_at),
    title: event.title,
    subtitle: event.summary || undefined,
    startsAt: event.starts_at,
    endsAt,
    location: event.location || "TBC",
    attendanceNote: event.body?.trim() || fallbackNote || "Attendance with dining — book via RSVP when open.",
    rsvpClosed: !event.rsvp_enabled,
  };
}

export function eventToMeetingListItem(event: EventRecord, lodgeSlug: string): LodgeMeetingListItem {
  const lodgeEvent = eventToLodgeEvent(event);
  const calendarHref = `/calendar/${event.slug}`;
  return {
    id: event.id,
    slug: event.slug,
    title: lodgeEvent.title,
    summary: event.summary || lodgeEvent.subtitle || "",
    startsAt: lodgeEvent.startsAt,
    endsAt: lodgeEvent.endsAt,
    location: lodgeEvent.location,
    attendanceNote: lodgeEvent.attendanceNote,
    rsvpOpen: !lodgeEvent.rsvpClosed,
    href: calendarHref,
    rsvpHref: event.rsvp_enabled ? calendarHref : lodgePath(lodgeSlug, "contact"),
  };
}

export function staticMeetingAsListItem(site: MarkSite): LodgeMeetingListItem {
  return {
    id: `static-${site.slug}-next`,
    slug: `${site.slug}-next-meeting`,
    title: site.event.title,
    summary: site.event.subtitle || "",
    startsAt: site.event.startsAt,
    endsAt: site.event.endsAt,
    location: site.event.location,
    attendanceNote: site.event.attendanceNote,
    rsvpOpen: !site.event.rsvpClosed,
    href: `${lodgePath(site.slug)}#event`,
    rsvpHref: site.bookingHref.startsWith("#")
      ? `${lodgePath(site.slug)}${site.bookingHref}`
      : site.bookingHref,
  };
}

export function isUpcomingStart(startsAt: string, now = Date.now()) {
  return new Date(startsAt).getTime() >= now - UPCOMING_GRACE_MS;
}

export function filterUpcomingLodgeEvents(events: EventRecord[], lodgeSlug: string) {
  return events
    .filter((event) => event.published && event.lodge_slug === lodgeSlug)
    .filter((event) => isUpcomingStart(event.starts_at))
    .slice()
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

export function resolveLodgeHomeMeeting(site: MarkSite, events: EventRecord[]) {
  const upcoming = filterUpcomingLodgeEvents(events, site.slug);
  const next = upcoming[0] ?? null;
  const bookingHref = next
    ? next.rsvp_enabled
      ? `/calendar/${next.slug}`
      : lodgePath(site.slug, "contact")
    : site.bookingHref.startsWith("#")
      ? `${lodgePath(site.slug)}${site.bookingHref}`
      : site.bookingHref;

  return {
    nextEvent: next,
    upcoming,
    label: site.nextMeetingLabel,
    targetIso: next?.starts_at ?? site.nextMeetingAt,
    bookingHref,
    featured: next ? eventToLodgeEvent(next) : site.event,
    list: upcoming.length
      ? upcoming.map((event) => eventToMeetingListItem(event, site.slug))
      : [staticMeetingAsListItem(site)],
  };
}
