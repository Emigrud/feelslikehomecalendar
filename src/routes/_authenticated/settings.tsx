import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceMark } from "@/components/calendar/SourceMark";
import { SyncButton } from "@/components/calendar/SyncButton";
import { CleanerLinkSection } from "@/components/calendar/CleanerLinkSection";
import { calendarSettingsQuery, syncTime } from "@/lib/calendar-settings";
import { saveCalendarSettings } from "@/lib/calendar-settings.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [
    { title: "Settings — Apartment Cleaning Calendar" },
    { name: "description", content: "Manage your apartment name, Airbnb and Booking.com calendar links, and sync status." },
    { property: "og:title", content: "Settings — Apartment Cleaning Calendar" },
    { property: "og:description", content: "Manage your apartment name, Airbnb and Booking.com calendar links, and sync status." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(calendarSettingsQuery),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: apt } = useSuspenseQuery(calendarSettingsQuery);
  const client = useQueryClient();
  const saveSettings = useServerFn(saveCalendarSettings);
  const [name, setName] = useState(apt.name);
  const [airbnb, setAirbnb] = useState(apt.airbnb_ical_url ?? "");
  const [booking, setBooking] = useState(apt.booking_ical_url ?? "");
  const [beds, setBeds] = useState(apt.bed_options.join(", "));
  const [inTime, setInTime] = useState(apt.std_checkin_time ?? "");
  const [outTime, setOutTime] = useState(apt.std_checkout_time ?? "");
  const [error, setError] = useState<string | null>(null);
  const bedList = beds.split(",").map((b) => b.trim()).filter(Boolean);
  const dirty = beds !== apt.bed_options.join(", ") || inTime !== (apt.std_checkin_time ?? "") || outTime !== (apt.std_checkout_time ?? "") || name !== apt.name || airbnb !== (apt.airbnb_ical_url ?? "") || booking !== (apt.booking_ical_url ?? "");
  const save = useMutation({
    mutationFn: () => saveSettings({ data: { name, airbnb, booking, bedOptions: bedList, checkIn: inTime, checkOut: outTime } }),
    onSuccess: async () => {
      setError(null);
      setName(name.trim()); setAirbnb(airbnb.trim()); setBooking(booking.trim()); setBeds(bedList.join(", ")); setInTime(inTime.trim()); setOutTime(outTime.trim());
      await Promise.all([client.invalidateQueries({ queryKey: ["calendar-settings"] }), client.invalidateQueries({ queryKey: ["apartment"] })]);
      toast.success("Settings saved");
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Couldn't save settings."),
  });
  function submit(e: FormEvent) { e.preventDefault(); setError(null); save.mutate(); }

  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
    <Button asChild variant="ghost" size="sm" className="mb-6"><Link to="/"><ArrowLeft />Calendar</Link></Button>
    <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cleaning calendar</p><h1 className="font-display text-3xl font-bold">Settings</h1></header>
    <form onSubmit={submit} className="space-y-8">
      <section className="space-y-3"><h2 className="font-display text-xl font-semibold">Apartment</h2><Label htmlFor="apartment-name">Apartment name</Label><Input id="apartment-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} disabled={save.isPending} /></section>
      <section className="space-y-4 border-t pt-6"><h2 className="font-display text-xl font-semibold">Preparation</h2>
        <div className="space-y-2"><Label htmlFor="bed-options">Bed options</Label><Input id="bed-options" placeholder="e.g. Sofa bed, Double bed" value={beds} onChange={(e) => setBeds(e.target.value)} disabled={save.isPending} /><p className="text-xs text-muted-foreground">Separate with commas.</p></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label htmlFor="std-in">Standard check-in</Label><Input id="std-in" placeholder="HH:MM" value={inTime} onChange={(e) => setInTime(e.target.value)} disabled={save.isPending} /></div>
          <div className="space-y-2"><Label htmlFor="std-out">Standard check-out</Label><Input id="std-out" placeholder="HH:MM" value={outTime} onChange={(e) => setOutTime(e.target.value)} disabled={save.isPending} /></div>
        </div>
        <p className="text-xs text-muted-foreground">Times are Vilnius time.</p>
      </section>
      <section className="space-y-5 border-t pt-6"><h2 className="font-display text-xl font-semibold">Calendar links</h2>
        <div className="space-y-2"><Label htmlFor="airbnb-link" className="flex items-center gap-2"><SourceMark source="airbnb" />Airbnb iCal link</Label><Input id="airbnb-link" type="url" autoComplete="off" spellCheck={false} placeholder="https://www.airbnb.com/…" value={airbnb} onChange={(e) => setAirbnb(e.target.value)} disabled={save.isPending} /></div>
        <div className="space-y-2"><Label htmlFor="booking-link" className="flex items-center gap-2"><SourceMark source="booking" />Booking.com iCal link</Label><Input id="booking-link" type="url" autoComplete="off" spellCheck={false} placeholder="https://admin.booking.com/…" value={booking} onChange={(e) => setBooking(e.target.value)} disabled={save.isPending} /></div>
      </section>
      {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!dirty || save.isPending}><Save />{save.isPending ? "Saving…" : "Save settings"}</Button>
    </form>
    <section className="mt-8 space-y-4 border-t pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-semibold">Sync status</h2><SyncButton disabled={dirty || save.isPending || (!apt.airbnb_ical_url && !apt.booking_ical_url)} /></div>
      <dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Last successful sync</dt><dd className="text-right">{syncTime(apt.last_synced_at)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Automatic sync</dt><dd>Every 30 minutes</dd></div></dl>
      {apt.last_sync_error && <p role="alert" className="break-words text-sm text-destructive">{apt.last_sync_error}</p>}
    </section>
    <CleanerLinkSection />
  </main>;
}