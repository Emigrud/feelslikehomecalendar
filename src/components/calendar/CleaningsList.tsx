import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatShort, guestLabel, toKey, type Reservation } from "@/lib/calendar";
import { buildCleanings, isTime, type CleaningItem } from "@/lib/cleanings";
import { shiftISO } from "@/lib/date-text";
import { SourceMark } from "./SourceMark";
import { SplitDateField } from "./SplitDateField";

export function CleaningsList({ reservations, editable = false }: { reservations: Reservation[]; editable?: boolean }) {
  const [showPast, setShowPast] = useState(false);
  const today = toKey(new Date());
  const all = useMemo(() => buildCleanings(reservations), [reservations]);
  const upcoming = all.filter((c) => c.date >= today);
  const past = all.filter((c) => c.date < today);
  const items = showPast ? [...past, ...upcoming] : upcoming;

  return (
    <div className="space-y-3 px-1">
      <div className="flex items-center justify-between gap-2">
        <Button size="sm" variant="outline" onClick={() => { setShowPast(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Today</Button>
        {past.length > 0 && <Button size="sm" variant="ghost" onClick={() => setShowPast((v) => !v)}>{showPast ? "Hide past cleanings" : "Show past cleanings"}</Button>}
      </div>
      {items.length === 0 && <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">No upcoming cleanings.</p>}
      {items.map((c) => <CleaningCard key={c.id} c={c} editable={editable} past={c.date < today} />)}
    </div>
  );
}

function Note({ label, text }: { label: string; text: string | null | undefined }) {
  if (!text?.trim()) return null;
  return <div className="rounded-md border-l-4 border-comment-border bg-comment px-3 py-2 text-comment-foreground"><span className="block text-xs font-bold uppercase tracking-wide">{label}</span><span className="whitespace-pre-line font-medium">{text}</span></div>;
}

function Guest({ r }: { r: Reservation }) {
  return <span className="flex items-center gap-1.5 font-semibold"><SourceMark source={r.source} className="h-4 w-4" />{guestLabel(r)} {r.guestName && <span className="font-normal text-muted-foreground">· {r.guestName}</span>}</span>;
}

function CleaningCard({ c, editable, past }: { c: CleaningItem; editable: boolean; past: boolean }) {
  const [editing, setEditing] = useState(false);
  const d = c.departure;
  return (
    <article className={cn("space-y-3 rounded-lg border bg-card p-4", past && "opacity-60")}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold">{formatShort(c.date)}</h2>
        {c.sameDay
          ? <span className="day-changeover rounded-md px-2 py-1 text-sm font-bold">Same-day changeover</span>
          : <span className="rounded-md bg-muted px-2 py-1 text-sm font-semibold text-muted-foreground">{c.next ? "Gap before next guest" : "No next guest yet"}</span>}
      </header>
      {c.overlap && <p className="flex items-start gap-2 rounded-md bg-warning px-3 py-2 text-sm font-semibold text-warning-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Another booking overlaps this stay — check before cleaning.</p>}

      <section className="space-y-1.5">
        <p className="text-sm font-bold text-checkout-foreground"><span className="rounded bg-checkout px-1.5 py-0.5">Departure</span> {formatShort(d.checkOut)} · Time not confirmed</p>
        <Guest r={d} />
        <Note label="Check-out note" text={d.checkOutComment} />
      </section>

      <section className="space-y-1.5 border-t pt-3">
        {c.next ? <>
          <p className="text-sm font-bold text-checkin-foreground"><span className="rounded bg-checkin px-1.5 py-0.5">Next arrival</span> {formatShort(c.next.checkIn)} · Time not confirmed</p>
          <Guest r={c.next} />
          <Note label="Check-in note" text={c.next.checkInComment} />
        </> : <p className="font-semibold text-muted-foreground">Next arrival not booked</p>}
      </section>

      <section className="space-y-2 border-t pt-3">
        {c.plan
          ? <p className="font-semibold">Cleaning planned: {formatShort(c.plan.date)}{c.plan.time ? ` at ${c.plan.time}` : ""}</p>
          : <p className="font-semibold text-muted-foreground">Cleaning date not set</p>}
        {c.planInvalid && <p className="flex items-start gap-2 rounded-md bg-warning px-3 py-2 text-sm font-semibold text-warning-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{editable ? "Booking dates changed — this plan no longer fits. Please set a new date." : "This plan may be out of date."}</p>}
        <p className="text-sm text-muted-foreground">Window: {formatShort(d.checkOut)} → {c.next ? formatShort(c.next.checkIn) : "open"}</p>
        {editable && (editing
          ? <PlanForm c={c} onDone={() => setEditing(false)} />
          : <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{c.plan ? "Change cleaning plan" : "Set cleaning date"}</Button>)}
      </section>
    </article>
  );
}

function PlanForm({ c, onDone }: { c: CleaningItem; onDone: () => void }) {
  const qc = useQueryClient();
  const d = c.departure;
  const min = d.checkOut;
  const max = c.next ? c.next.checkIn : shiftISO(d.checkOut, 60);
  const [date, setDate] = useState(c.plan && !c.planInvalid ? c.plan.date : min);
  const [time, setTime] = useState(c.plan?.time ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const write = async (fields: { cleaning_date: string | null; cleaning_time: string | null }) => {
    setSaving(true);
    const { error } = d.splitId
      ? await supabase.from("reservation_splits").update(fields).eq("id", d.splitId)
      : await supabase.from("reservations").update(fields).eq("id", d.parentId ?? d.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
    onDone();
  };
  const save = () => {
    if (!date) return setError(`Pick a date between ${formatShort(min)} and ${formatShort(max)}.`);
    const t = time.trim();
    if (t && !isTime(t)) return setError("Time: use HH:MM, e.g. 12:30, or leave empty.");
    write({ cleaning_date: date, cleaning_time: t || null });
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label htmlFor={`cd-${c.id}`}>Cleaning date</Label>
      <SplitDateField id={`cd-${c.id}`} value={date} onChange={setDate} min={min} max={max} />
      <Label htmlFor={`ct-${c.id}`}>Time (optional)</Label>
      <Input id={`ct-${c.id}`} placeholder="HH:MM" inputMode="numeric" value={time} onChange={(e) => setTime(e.target.value)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={saving} onClick={save}>Save</Button>
        {c.plan && <Button size="sm" variant="ghost" className="text-destructive" disabled={saving} onClick={() => write({ cleaning_date: null, cleaning_time: null })}>Remove plan</Button>}
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}
