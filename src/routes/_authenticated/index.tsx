import { createFileRoute, useNavigate, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayDetails } from "@/components/calendar/DayDetails";
import { Legend } from "@/components/calendar/Legend";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { addDemoBookings, apartmentQuery } from "@/lib/apartment-data";
import { dayInfo } from "@/lib/calendar";

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
  const selected = selectedDate ? dayInfo(selectedDate, apt.reservations) : null;

  const demo = useMutation({
    mutationFn: () => addDemoBookings(apt.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apartment"] }),
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-2 py-4 sm:px-6 sm:py-8">
      <header className="mb-4 flex items-start justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cleaning calendar</p>
          <h1 className="font-display text-3xl font-bold">{apt.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
      </header>
      {apt.reservations.length === 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-3 text-sm">
          <span className="text-muted-foreground">No bookings yet. Calendar links are connected in a later step.</span>
          <Button size="sm" variant="secondary" disabled={demo.isPending} onClick={() => demo.mutate()}>
            {demo.isPending ? "Adding…" : "Add demo bookings"}
          </Button>
        </div>
      )}
      <MonthCalendar
        year={ym.y}
        month={ym.m}
        reservations={apt.reservations}
        onChangeMonth={(y, m) => setYm({ y, m })}
        onSelectDay={(d) => setSelectedDate(d.date)}
      />
      <Legend />
      <DayDetails info={selected} onClose={() => setSelectedDate(null)} editable />
    </main>
  );
}
