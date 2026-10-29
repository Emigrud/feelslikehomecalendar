import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/lib/calendar";
import {
  COT_LABEL, EMPTY_PREP, nextStatus, parseTime, parseTowels, prepToRow, shownTime, timezoneLabel,
  type ApartmentTimes, type Cot,
} from "@/lib/preparation";

function TimeLine({ label, override, standard, tz }: { label: string; override: string | null; standard: string | null; tz: string }) {
  const t = shownTime(override, standard);
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">
        {t.time ? <>{t.time} <span className="font-normal text-muted-foreground">{t.standard ? "standard" : ""} ({timezoneLabel(tz)})</span></> : <span className="font-normal text-muted-foreground">Time not confirmed</span>}
      </dd>
    </>
  );
}

/** Arrival card: beds, cot, towels, times. Departure card: check-out time only. */
export function PrepSection({ r, role, times, editable }: { r: Reservation; role: "in" | "out"; times: ApartmentTimes; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const p = r.prep ?? EMPTY_PREP;
  if (role === "out") {
    return <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1"><TimeLine label="Check-out" override={p.checkOutTime} standard={times.checkOutTime} tz={times.timezone} /></dl>;
  }
  if (editing) return <PrepForm r={r} times={times} onDone={() => setEditing(false)} />;
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Preparation</p>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold", p.status === "confirmed" ? "bg-checkin text-checkin-foreground" : "bg-warning text-warning-foreground")}>
          {p.status === "confirmed" ? "Confirmed" : "Pending"}
        </span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Beds</dt>
        <dd className="font-semibold">{p.beds.length ? p.beds.join(", ") : <span className="font-normal text-muted-foreground">Not set</span>}</dd>
        {p.bedNote && <><dt className="text-muted-foreground">Bed notes</dt><dd className="whitespace-pre-line font-semibold">{p.bedNote}</dd></>}
        <dt className="text-muted-foreground">Baby cot</dt><dd className="font-semibold">{COT_LABEL[p.cot]}</dd>
        <dt className="text-muted-foreground">Towel sets</dt><dd className="font-semibold">{p.towels ?? <span className="font-normal text-muted-foreground">Not set</span>}</dd>
        <TimeLine label="Check-in" override={p.checkInTime} standard={times.checkInTime} tz={times.timezone} />
        <dt className="text-muted-foreground">Guest arrival</dt>
        <dd className="font-semibold">{p.arrivalTime ? `${p.arrivalTime} (${timezoneLabel(times.timezone)})` : <span className="font-normal text-muted-foreground">Not confirmed</span>}</dd>
      </dl>
      {editable && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit preparation</Button>}
    </div>
  );
}

function PrepForm({ r, times, onDone }: { r: Reservation; times: ApartmentTimes; onDone: () => void }) {
  const qc = useQueryClient();
  const p = r.prep ?? EMPTY_PREP;
  const options = Array.from(new Set([...times.bedOptions, ...p.beds]));
  const [beds, setBeds] = useState<string[]>(p.beds);
  const [bedNote, setBedNote] = useState(p.bedNote ?? "");
  const [cot, setCot] = useState<Cot>(p.cot);
  const [towels, setTowels] = useState(p.towels == null ? "" : String(p.towels));
  const [inTime, setInTime] = useState(p.checkInTime ?? "");
  const [outTime, setOutTime] = useState(p.checkOutTime ?? "");
  const [arrival, setArrival] = useState(p.arrivalTime ?? "");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const t = parseTowels(towels);
    if (t === undefined) return setError("Towel sets: a whole number from 0 to 30, or leave empty.");
    const ci = parseTime(inTime), co = parseTime(outTime), ar = parseTime(arrival);
    if (ci === undefined || co === undefined || ar === undefined) return setError("Times: use 24-hour HH:MM, e.g. 15:00, or leave empty.");
    const fields = { beds, bedNote: bedNote.trim() || null, cot, towels: t, checkInTime: ci, checkOutTime: co, arrivalTime: ar };
    const row = prepToRow({ ...fields, status: nextStatus(p, fields, confirm) });
    setSaving(true);
    const { error } = r.splitId
      ? await supabase.from("reservation_splits").update(row).eq("id", r.splitId)
      : await supabase.from("reservations").update(row).eq("id", r.parentId ?? r.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
    onDone();
  }

  const id = r.id;
  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border p-3">
      <p className="font-semibold">Preparation</p>
      <div className="space-y-1.5">
        <Label>Beds to prepare</Label>
        {options.length === 0 && <p className="text-sm text-muted-foreground">Add bed options in Settings.</p>}
        <div className="flex flex-wrap gap-3">
          {options.map((b) => (
            <label key={b} className="flex items-center gap-2">
              <Checkbox checked={beds.includes(b)} onCheckedChange={(v) => setBeds((cur) => v ? [...cur, b] : cur.filter((x) => x !== b))} />{b}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`bn-${id}`}>Bed notes</Label>
        <Input id={`bn-${id}`} placeholder="e.g. separate bedding for each adult" value={bedNote} onChange={(e) => setBedNote(e.target.value)} maxLength={300} />
      </div>
      <div className="space-y-1.5">
        <Label>Baby cot</Label>
        <div className="flex gap-2">
          {(["unknown", "yes", "no"] as Cot[]).map((c) => (
            <Button key={c} type="button" size="sm" variant={cot === c ? "default" : "outline"} onClick={() => setCot(c)}>{COT_LABEL[c]}</Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor={`tw-${id}`}>Towel sets</Label><Input id={`tw-${id}`} inputMode="numeric" value={towels} onChange={(e) => setTowels(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor={`ar-${id}`}>Guest arrival</Label><Input id={`ar-${id}`} placeholder="HH:MM" value={arrival} onChange={(e) => setArrival(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor={`ci-${id}`}>Check-in time</Label><Input id={`ci-${id}`} placeholder={times.checkInTime ? `${times.checkInTime} standard` : "HH:MM"} value={inTime} onChange={(e) => setInTime(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor={`co-${id}`}>Check-out time</Label><Input id={`co-${id}`} placeholder={times.checkOutTime ? `${times.checkOutTime} standard` : "HH:MM"} value={outTime} onChange={(e) => setOutTime(e.target.value)} /></div>
      </div>
      <p className="text-xs text-muted-foreground">Leave a time empty to use the standard time ({timezoneLabel(times.timezone)}).</p>
      <label className="flex items-center gap-2 font-medium"><Checkbox checked={confirm} onCheckedChange={(v) => setConfirm(!!v)} />Mark preparation as confirmed</label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
