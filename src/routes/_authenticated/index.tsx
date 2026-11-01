import { createFileRoute, Link, useNavigate, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayDetails } from "@/components/calendar/DayDetails";
import { Legend } from "@/components/calendar/Legend";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { apartmentQuery } from "@/lib/apartment-data";
import { dayInfo } from "@/lib/calendar";
import { Settings } from "lucide-react";
import { SyncButton } from "@/components/calendar/SyncButton";
import { CleaningsList } from "@/components/calendar/CleaningsList";
import { ViewToggle, useSavedView } from "@/components/calendar/ViewToggle";

export const Route = createFileRoute("/_authenticated/")({
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
  loader: ({ context }) => context.queryClient.ensureQueryData(apartmentQuery),
  component: Index,
  errorComponent: LoadError,
});

function LoadError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-sm p-6 text-center">
      <p className="mb-4 text-sm text-muted-foreground">Couldn't load the calendar: {error instanceof Error ? error.message : String(error)}</p>
      <Button onClick={() => router.invalidate()}>Try again</Button>
    </div>
  );
}

function Index() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: apt } = useSuspenseQuery(apartmentQuery);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [view, setView] = useSavedView();
  const selected = selectedDate ? dayInfo(selectedDate, apt.reservations) : null;


  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-2 py-4 sm:px-6 sm:py-8">
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 px-1 sm:flex sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cleaning calendar</p>
          <h1 className="break-words font-display text-3xl font-bold">{apt.name}</h1>
        </div>
        <Button className="shrink-0" variant="outline" size="sm" onClick={signOut}>Sign out</Button>
      </header>
      <div className="mb-4 flex items-center justify-between gap-2 px-1">
        <Button asChild size="sm" variant="ghost"><Link to="/settings"><Settings />Settings</Link></Button>
        <SyncButton />
      </div>
      {apt.reservations.length === 0 && (
        <div className="mb-4 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          No bookings yet. Add your calendar links in Settings, then tap Sync now.
        </div>
      )}
      <ViewToggle view={view} onChange={setView} />
      {view === "cleanings" ? <CleaningsList reservations={apt.reservations} editable /> : <>
      <MonthCalendar
        year={ym.y}
        month={ym.m}
        reservations={apt.reservations}
        onChangeMonth={(y, m) => setYm({ y, m })}
        onSelectDay={(d) => setSelectedDate(d.date)}
      />
      <Legend />
      </>}
      <DayDetails info={selected} onClose={() => setSelectedDate(null)} editable apartmentId={apt.id} allReservations={apt.reservations} />
    </main>
  );
}
