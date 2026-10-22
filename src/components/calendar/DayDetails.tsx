import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatShort, nights, sourceName, type DayInfo, type Reservation } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Source } from "@/lib/calendar";
import { ReservationEditForm } from "./ReservationEditForm";
import { Input } from "@/components/ui/input";
import { isValidSplitDate } from "@/lib/reservation-row";
import { SourceMark } from "./SourceMark";

interface Props {
  info: DayInfo | null;
  onClose: () => void;
  /** Owner can edit guest details; cleaner view leaves this off. */
  editable?: boolean;
}

export function DayDetails({ info, onClose, editable = false }: Props) {
  const isMobile = useIsMobile();
  const open = !!info;
  const title = info ? formatShort(info.date) : "";
  const body = info && (
    <div className="space-y-4 px-4 pb-6 sm:px-0 sm:pb-0">
      {info.reservations.map((r) => (
        <ReservationCard key={r.id} r={r} dayDate={info.date} role={r.isBlocked ? "blocked" : r === info.checkOut ? "out" : r === info.checkIn ? "in" : "stay"} editable={editable} />
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader><DrawerTitle className="font-display text-2xl">{title}</DrawerTitle></DrawerHeader>
          <div className="overflow-y-auto">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">{title}</DialogTitle></DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

const ROLE = {
  out: { label: "Check-out", cls: "bg-checkout text-checkout-foreground" },
  in: { label: "Check-in", cls: "bg-checkin text-checkin-foreground" },
  stay: { label: "Staying", cls: "bg-staying text-staying-foreground" },
  blocked: { label: "Blocked", cls: "bg-blocked text-blocked-foreground" },
};

function ReservationCard({ r, dayDate, role, editable }: { r: Reservation; dayDate?: string; role: keyof typeof ROLE; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [splitDate, setSplitDate] = useState("");
  const qc = useQueryClient();
  const addSplit = async () => {
    if (!isValidSplitDate(r, splitDate)) { toast.error("Pick a date after check-in and before check-out."); return; }
    setSaving(true);
    const { error } = await supabase.from("reservation_splits").insert({ reservation_id: r.parentId ?? r.id, start_date: splitDate });
    setSaving(false);
    if (error) { toast.error("Couldn't split. Please try again."); return; }
    setSplitting(false); setSplitDate("");
    await qc.invalidateQueries({ queryKey: ["apartment"] });
    toast.success("Booking split. Tap the new part to add its guests.");
  };
  const joinBack = async () => {
    if (!r.splitId) return;
    setSaving(true);
    const { error } = await supabase.from("reservation_splits").delete().eq("id", r.splitId);
    setSaving(false);
    if (error) { toast.error("Couldn't join. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
  };
  const mark = async (kind: "booking" | "blocked", source?: Source) => {
    setSaving(true);
    const { error } = await supabase.from("reservations").update({ owner_kind: kind, owner_source: source ?? null }).eq("id", r.parentId ?? r.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
  };
  if (r.isBlocked) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4 text-base">
        <span className={cn("rounded-md px-2 py-1 text-sm font-bold", ROLE.blocked.cls)}>{ROLE.blocked.label}</span>
        <p className="text-lg font-semibold">{formatShort(r.checkIn)} → {formatShort(r.checkOut)}, {nights(r)} {nights(r) === 1 ? "night" : "nights"}</p>
        {editable && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Is this actually a guest booking?</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={saving} onClick={() => mark("booking", "booking")}><SourceMark source="booking" className="h-4 w-4" />Mark as Booking.com booking</Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => mark("booking", "airbnb")}><SourceMark source="airbnb" className="h-4 w-4" />Mark as Airbnb booking</Button>
            </div>
          </div>
        )}
      </div>
    );
  }
  const kids = r.kidsAges ?? [];
  const missing = r.adults == null;
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-base">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("rounded-md px-2 py-1 text-sm font-bold", ROLE[role].cls)}>{ROLE[role].label}</span>
        <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
          <SourceMark source={r.source} className="h-4 w-4" />
          {sourceName(r.source)}
        </span>
      </div>
      <p className="text-lg font-semibold">
        {formatShort(r.checkIn)} → {formatShort(r.checkOut)}, {nights(r)} {nights(r) === 1 ? "night" : "nights"}
      </p>
      {editing ? <ReservationEditForm r={r} onDone={() => setEditing(false)} /> : <>
      {missing ? (
        <p className="rounded-md bg-warning px-3 py-2 font-semibold text-warning-foreground">Guest numbers not filled in yet</p>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Adults</dt><dd className="font-semibold">{r.adults}</dd>
          <dt className="text-muted-foreground">Kids</dt>
          <dd className="font-semibold">
            {kids.length === 0 ? "None" : `${kids.length} ${kids.length === 1 ? "kid" : "kids"}: ${kids.map((a) => `${a} ${a === 1 ? "year" : "years"}`).join(", ")}`}
          </dd>
          {r.guestName && (<><dt className="text-muted-foreground">Guest</dt><dd className="font-semibold">{r.guestName}</dd></>)}
        </dl>
      )}
      {missing && r.guestName && <p><span className="text-muted-foreground">Guest: </span><span className="font-semibold">{r.guestName}</span></p>}
      {r.comment && (
        <div className="rounded-md border-l-4 border-comment-border bg-comment px-3 py-2 font-medium text-comment-foreground">{r.comment}</div>
      )}
      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit details</Button>
          {nights(r) > 1 && <Button variant="outline" size="sm" onClick={() => setSplitting((v) => !v)}>Split booking</Button>}
          {r.splitId && <Button variant="outline" size="sm" disabled={saving} onClick={joinBack}>Join back with previous guest</Button>}
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => mark("blocked")}>Mark as blocked</Button>
        </div>
      )}
      {editable && splitting && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm text-muted-foreground">Date the next guest checks in (changeover day):</p>
          <Input type="date" min={r.checkIn} max={r.checkOut} value={splitDate} onChange={(e) => setSplitDate(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={saving || !splitDate} onClick={addSplit}>Split here</Button>
            <Button size="sm" variant="ghost" onClick={() => setSplitting(false)}>Cancel</Button>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
