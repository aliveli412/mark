import type { Metadata } from "next";
import { PageBanner } from "@/components/PageBanner";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <>
      <PageBanner title="Calendar" />
      <div className="wrap page">
        <div className="empty">
          <h2>No meetings are published yet</h2>
          <p>
            The WordPress calendar is an EventON list covering twelve months, with search and a month jumper. The public page does not contain any event records, so this calendar is empty until those events are exported from the WordPress admin.
          </p>
        </div>
      </div>
    </>
  );
}
