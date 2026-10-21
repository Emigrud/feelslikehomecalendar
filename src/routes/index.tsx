import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayDetails } from "@/components/calendar/DayDetails";
import { Legend } from "@/components/calendar/Legend";
import { sampleReservations } from "@/lib/sample-data";
import type { DayInfo, Reservation } from "@/lib/calendar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cleaning Calendar — Apartment" },
      { name: "description", content: "See check-ins, check-outs and guest numbers for the apartment at a glance." },
      { property: "og:title", content: "Cleaning Calendar — Apartment" },
      { property: "og:description", content: "See check-ins, check-outs and guest numbers for the apartment at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<DayInfo | null>(null);

  // Sample data depends on "today", so build it on the client to avoid mismatches.
  useEffect(() => setReservations(sampleReservations()), []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-2 py-4 sm:px-6 sm:py-8">
      <header className="mb-4 px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cleaning calendar</p>
        <h1 className="font-display text-3xl font-bold">Old Town Apartment</h1>
      </header>
      <MonthCalendar
        year={ym.y}
        month={ym.m}
        reservations={reservations}
        onChangeMonth={(y, m) => setYm({ y, m })}
        onSelectDay={setSelected}
      />
      <Legend />
      <DayDetails info={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
