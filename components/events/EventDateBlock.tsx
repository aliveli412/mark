import { eventDateParts } from "@/lib/format";

export function EventDateBlock({ startsAt }: { startsAt: string }) {
  const parts = eventDateParts(startsAt);
  return (
    <time className="ev-date" dateTime={startsAt} aria-label={`${parts.weekday} ${parts.day} ${parts.month}`}>
      <span className="ev-date-month">{parts.month}</span>
      <span className="ev-date-day">{parts.day}</span>
      <span className="ev-date-week">{parts.weekday}</span>
    </time>
  );
}
