import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Reservation, Source } from "@/lib/calendar";
import { shiftISO } from "@/lib/date-text";
import { SplitDateField } from "./SplitDateField";
import { SourceMark } from "./SourceMark";

type Kind = { source: Source; blocked: boolean };

/** Owner adds a booking or block on an empty day; syncs never touch it (manual- uid). */
export function AddEntryForm({ date, apartmentId, reservations }: { date: string; apartmentId: string; reservations: Reservation[] }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<Kind | null>(null);
  const [checkIn, setCheckIn] = useState(date);
  const [checkOut, setCheckOut] = useState(shiftISO(date, 1));
  const [saving, setSaving] = useState(false);
  const ok = !!checkIn && !!checkOut && checkIn < checkOut;
  const overlap = ok && reservations.some((r) => r.status === "active" && r.checkIn < checkOut && checkIn < r.checkOut);

  const save = async () => {
    if (!kind || !ok) return;
    setSaving(true);
    const { error } = await supabase.from("reservations").insert({
      apartment_id: apartmentId, source: kind.source, external_uid: `manual-${crypto.randomUUID()}`,
      check_in: checkIn, check_out: checkOut, is_blocked: kind.blocked,
    });
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
    toast.success(kind.blocked ? "Dates blocked." : "Booking added.");
  };

  if (!kind) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Nothing on this day yet. Add:</p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => setKind({ source: "airbnb", blocked: false })}><SourceMark source="airbnb" className="h-4 w-4" />Add Airbnb booking</Button>
          <Button variant="outline" onClick={() => setKind({ source: "booking", blocked: false })}><SourceMark source="booking" className="h-4 w-4" />Add Booking.com booking</Button>
          <Button variant="outline" onClick={() => setKind({ source: "airbnb", blocked: true })}>Block dates</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="font-semibold">{kind.blocked ? "Block dates" : kind.source === "airbnb" ? "New Airbnb booking" : "New Booking.com booking"}</p>
      <div className="space-y-1.5">
        <Label htmlFor="add-ci">{kind.blocked ? "From" : "Check-in"}</Label>
        <SplitDateField id="add-ci" value={checkIn} onChange={setCheckIn} min={shiftISO(date, -365)} max={shiftISO(date, 730)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="add-co">{kind.blocked ? "Until" : "Check-out"}</Label>
        <SplitDateField id="add-co" value={checkOut} onChange={setCheckOut} min={shiftISO(date, -364)} max={shiftISO(date, 731)} />
      </div>
      {checkIn && checkOut && !ok && <p className="text-sm font-semibold text-destructive">Check-out must be after check-in.</p>}
      {overlap && <p className="rounded-md bg-warning px-3 py-2 text-sm font-semibold text-warning-foreground">These dates overlap another entry. You can still save.</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={saving || !ok} onClick={save}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setKind(null)}>Back</Button>
      </div>
    </div>
  );
}
