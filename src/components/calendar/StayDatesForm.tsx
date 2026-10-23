import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Reservation } from "@/lib/calendar";
import { shiftISO } from "@/lib/date-text";
import { SplitDateField } from "./SplitDateField";

/** Owner changes check-in / check-out; saved separately so calendar syncs never undo it. */
export function StayDatesForm({ r, onDone }: { r: Reservation; onDone: () => void }) {
  const qc = useQueryClient();
  const [checkIn, setCheckIn] = useState(r.checkIn);
  const [checkOut, setCheckOut] = useState(r.checkOut);
  const [saving, setSaving] = useState(false);
  const lo = shiftISO(r.checkIn, -365);
  const hi = shiftISO(r.checkOut, 365);
  const ok = !!checkIn && !!checkOut && checkIn < checkOut;

  const save = async () => {
    if (!ok) { toast.error("Check-out must be after check-in."); return; }
    setSaving(true);
    const { error } = await supabase.from("reservations").update({ owner_check_in: checkIn, owner_check_out: checkOut }).eq("id", r.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
    onDone();
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`ci-${r.id}`}>Check-in</Label>
        <SplitDateField id={`ci-${r.id}`} value={checkIn} onChange={setCheckIn} min={lo} max={hi} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`co-${r.id}`}>Check-out</Label>
        <SplitDateField id={`co-${r.id}`} value={checkOut} onChange={setCheckOut} min={lo} max={hi} />
      </div>
      {checkIn && checkOut && !ok && <p className="text-sm font-semibold text-destructive">Check-out must be after check-in.</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={saving || !ok} onClick={save}>Save dates</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}
