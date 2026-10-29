import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayDetails } from "@/components/calendar/DayDetails";
import { Legend } from "@/components/calendar/Legend";
import { getCleanerCalendar } from "@/lib/cleaner.functions";
import { dayInfo } from "@/lib/calendar";

const cleanerQuery = (token: string) => queryOptions({
  queryKey: ["cleaner", token],
  queryFn: () => getCleanerCalendar({ data: { token } }),
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  retry: false,
});

export const Route = createFileRoute("/c/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cleaning schedule" },
      { name: "description", content: "Read-only cleaning schedule for the apartment." },
      { property: "og:title", content: "Cleaning schedule" },
      { property: "og:description", content: "Read-only cleaning schedule for the apartment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CleanerPage,
});

function CleanerPage() {
  const { token } = Route.useParams();
  const { data, error, isLoading } = useQuery(cleanerQuery(token));
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (isLoading) return <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>;
  if (error || !data) return <p className="mx-auto max-w-sm p-6 text-center text-sm text-muted-foreground">{error instanceof Error ? error.message : "Could not load the calendar."}</p>;

  const selected = selectedDate ? dayInfo(selectedDate, data.reservations) : null;
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-2 py-4 sm:px-6 sm:py-8">
      <header className="mb-4 px-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cleaning schedule</p>
        <h1 className="break-words font-display text-3xl font-bold">{data.name}</h1>
      </header>
      <MonthCalendar year={ym.y} month={ym.m} reservations={data.reservations} onChangeMonth={(y, m) => setYm({ y, m })} onSelectDay={(d) => setSelectedDate(d.date)} />
      <Legend />
      <DayDetails info={selected} onClose={() => setSelectedDate(null)}  times={data.times} />
    </main>
  );
}
