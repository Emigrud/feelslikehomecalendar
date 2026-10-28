import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseAdults, parseKidsAges } from "@/lib/guest-input";
import type { Reservation } from "@/lib/calendar";

export function ReservationEditForm({ r, onDone }: { r: Reservation; onDone: () => void }) {
  const qc = useQueryClient();
  const [adults, setAdults] = useState(r.adults == null ? "" : String(r.adults));
  const [kids, setKids] = useState((r.kidsAges ?? []).join(", "));
  const [name, setName] = useState(r.guestName ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (v: { adults: number | null; kids: number[] }) => {
      const fields = { adults: v.adults, kids_ages: v.kids, guest_name: name.trim() || null };
      const { error } = r.splitId
        ? await supabase.from("reservation_splits").update(fields).eq("id", r.splitId)
        : await supabase.from("reservations").update(fields).eq("id", r.parentId ?? r.id);
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["apartment"] }); onDone(); },
    onError: (e) => setError(e instanceof Error ? e.message : "Could not save"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const a = parseAdults(adults);
    if (a === undefined) return setError("Adults must be a number from 1 to 20 (or leave empty).");
    const k = parseKidsAges(kids);
    if (k === null) return setError("Kids' ages: numbers 0–17 separated by commas, e.g. 3, 7.");
    save.mutate({ adults: a, kids: k });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`a-${r.id}`}>Adults</Label>
          <Input id={`a-${r.id}`} inputMode="numeric" placeholder="?" value={adults} onChange={(e) => setAdults(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`k-${r.id}`}>Kids' ages</Label>
          <Input id={`k-${r.id}`} placeholder="e.g. 3, 7" value={kids} onChange={(e) => setKids(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`n-${r.id}`}>Guest name</Label>
        <Input id={`n-${r.id}`} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}
