"use client";

import { useEffect, useState } from "react";

function partsUntil(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function Countdown({
  targetIso,
  label,
  bookingHref,
  showBookingLink = true,
}: {
  targetIso: string;
  label: string;
  bookingHref: string;
  showBookingLink?: boolean;
}) {
  const targetMs = new Date(targetIso).getTime();
  const [parts, setParts] = useState(() => partsUntil(targetMs));

  useEffect(() => {
    const id = window.setInterval(() => setParts(partsUntil(targetMs)), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);

  const blocks = [
    { label: "Days", value: parts.days },
    { label: "Hours", value: parts.hours },
    { label: "Minutes", value: parts.minutes },
    { label: "Seconds", value: parts.seconds },
  ];

  return (
    <section className="lodge-countdown">
      {label ? <h2>{label}</h2> : null}
      <div className="lodge-count-grid" aria-live="polite">
        {blocks.map((block) => (
          <div key={block.label}>
            <strong>{String(block.value).padStart(2, "0")}</strong>
            <span>{block.label}</span>
          </div>
        ))}
      </div>
      {showBookingLink ? (
        <p>
          Please{" "}
          <a href={bookingHref}>click here for attendance and booking</a>!
        </p>
      ) : null}
    </section>
  );
}
