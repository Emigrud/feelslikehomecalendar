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
import { SourceMark } from "./SourceMark";
import { StayDatesForm } from "./StayDatesForm";
import { Pencil } from "lucide-react";
import { AddEntryForm } from "./AddEntryForm";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PrepSection } from "./PrepSection";
import type { ApartmentTimes } from "@/lib/preparation";

interface Props {
  info: DayInfo | null;
  onClose: () => void;
  /** Owner can edit guest details; cleaner view leaves this off. */
  editable?: boolean;
  apartmentId?: string;
  allReservations?: Reservation[];
  times?: ApartmentTimes;
}

export function DayDetails({ info, onClose, editable = false, apartmentId, allReservations = [], times }: Props) {
  const isMobile = useIsMobile();
  const open = !!info;
  const title = info ? formatShort(info.date) : "";
  const body = info && (
    <div className="space-y-4 px-4 pb-6 sm:px-0 sm:pb-0">
      {info.reservations.map((r) => (
        <ReservationCard key={r.id} r={r} dayDate={info.date} role={r.isBlocked ? "blocked" : r === info.checkOut ? "out" : r === info.checkIn ? "in" : "stay"} editable={editable} times={times} />
      ))}
      {editable && apartmentId && info.reservations.length === 0 && (
        <AddEntryForm key={info.date} date={info.date} apartmentId={apartmentId} reservations={allReservations} />
      )}
      {editable && apartmentId && ["checkin", "checkout", "changeover", "staying"].includes(info.kind) && (
        <AddEntryForm key={`occ-${info.date}`} occupied date={info.date} apartmentId={apartmentId} reservations={allReservations} />
      )}
      {editable && apartmentId && (info.kind === "blocked" || info.kind === "checkout-blocked") && (
        <AddEntryForm key={`blk-${info.date}`} allowBlock={false} date={info.date} apartmentId={apartmentId} reservations={allReservations} />
      )}
      {!editable && info.reservations.length === 0 && <p className="text-muted-foreground">Nothing on this day.</p>}
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

function ReservationCard({ r, dayDate, role, editable, times }: { r: Reservation; dayDate?: string; role: keyof typeof ROLE; editable: boolean; times?: ApartmentTimes }) {
  const [editing, setEditing] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
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
    const blocked = kind === "blocked";
    // A part of a split stay is greyed out on its own; the rest of the stay is left alone.
    const { error } = r.splitId
      ? await supabase.from("reservation_splits").update({ is_blocked: blocked }).eq("id", r.splitId)
      : r.parentId
        ? await supabase.from("reservations").update({ first_part_blocked: blocked }).eq("id", r.parentId)
        : await supabase.from("reservations").update({ owner_kind: kind, owner_source: source ?? null }).eq("id", r.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
  };
  const remove = async () => {
    if (!window.confirm("Delete this entry?")) return;
    setSaving(true);
    const { error } = await supabase.from("reservations").delete().eq("id", r.id);
    setSaving(false);
    if (error) { toast.error("Couldn't delete. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
  };
  if (r.isBlocked) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-4 text-base">
        <span className={cn("rounded-md px-2 py-1 text-sm font-bold", ROLE.blocked.cls)}>{ROLE.blocked.label}</span>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">{formatShort(r.checkIn)} → {formatShort(r.checkOut)}, {nights(r)} {nights(r) === 1 ? "night" : "nights"}</p>
          {editable && !r.parentId && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Change dates" onClick={() => setEditingDates((v) => !v)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        {editingDates && <StayDatesForm r={r} onDone={() => setEditingDates(false)} />}
        {r.comment && !editing && (
          <div className="rounded-md border-l-4 border-comment-border bg-comment px-3 py-2 font-medium text-comment-foreground">{r.comment}</div>
        )}
        {editable && (editing
          ? <BlockCommentForm r={r} onDone={() => setEditing(false)} />
          : <Button size="sm" variant="outline" onClick={() => setEditing(true)}>{r.comment ? "Edit comment" : "Add comment"}</Button>)}
        {editable && r.isManual && !r.parentId && (
          <Button size="sm" variant="ghost" className="text-destructive" disabled={saving} onClick={remove}>Delete block</Button>
        )}
        {editable && r.splitId && (
          <Button size="sm" variant="outline" disabled={saving} onClick={joinBack}>Join back with previous guest</Button>
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
      <div className="flex items-center gap-2">
        <p className="text-lg font-semibold">
          {formatShort(r.checkIn)} → {formatShort(r.checkOut)}, {nights(r)} {nights(r) === 1 ? "night" : "nights"}
        </p>
        {editable && !r.parentId && (
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Change stay dates" onClick={() => setEditingDates((v) => !v)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
      {editingDates && <StayDatesForm r={r} onDone={() => setEditingDates(false)} />}
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
      {(role === "in" || role === "out") && times && <PrepSection r={r} role={role} times={times} editable={editable} />}
      {(role === "in" || role === "out") && <StayCommentEditor r={r} which={role} editable={editable} />}
      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit details</Button>
          {r.splitId && <Button variant="outline" size="sm" disabled={saving} onClick={joinBack}>Join back with previous guest</Button>}
          <Button variant="ghost" size="sm" disabled={saving} onClick={() => mark("blocked")}>Mark as blocked</Button>
          {r.isManual && !r.parentId && <Button variant="ghost" size="sm" className="text-destructive" disabled={saving} onClick={remove}>Delete</Button>}
        </div>
      )}
      </>}
    </div>
  );
}

function BlockCommentForm({ r, onDone }: { r: Reservation; onDone: () => void }) {
  const qc = useQueryClient();
  const [text, setText] = useState(r.comment ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const fields = { comment: text.trim() || null };
    const { error } = r.splitId
      ? await supabase.from("reservation_splits").update(fields).eq("id", r.splitId)
      : await supabase.from("reservations").update(fields).eq("id", r.parentId ?? r.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
    onDone();
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={`bc-${r.id}`}>Comment</Label>
      <Textarea id={`bc-${r.id}`} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" disabled={saving} onClick={save}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

function StayCommentEditor({ r, which, editable }: { r: Reservation; which: "in" | "out"; editable: boolean }) {
  const qc = useQueryClient();
  const current = (which === "in" ? r.checkInComment : r.checkOutComment) ?? null;
  const label = which === "in" ? "check-in comment" : "check-out comment";
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(current ?? "");
  const [saving, setSaving] = useState(false);
  const write = async (value: string | null) => {
    setSaving(true);
    const fields = which === "in" ? { checkin_comment: value } : { checkout_comment: value };
    const { error } = r.splitId
      ? await supabase.from("reservation_splits").update(fields).eq("id", r.splitId)
      : await supabase.from("reservations").update(fields).eq("id", r.parentId ?? r.id);
    setSaving(false);
    if (error) { toast.error("Couldn't save. Please try again."); return; }
    await qc.invalidateQueries({ queryKey: ["apartment"] });
    setEditing(false);
  };
  if (editing) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`sc-${which}-${r.id}`} className="capitalize">{label}</Label>
        <Textarea id={`sc-${which}-${r.id}`} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex gap-2">
          <Button size="sm" disabled={saving} onClick={() => write(text.trim() || null)}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }
  return (
    <>
      {current && <div className="rounded-md border-l-4 border-comment-border bg-comment px-3 py-2 font-medium text-comment-foreground">{current}</div>}
      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => { setText(current ?? ""); setEditing(true); }}>{current ? `Edit ${label}` : `Add ${label}`}</Button>
          {current && <Button size="sm" variant="ghost" className="text-destructive" disabled={saving} onClick={() => window.confirm(`Delete the ${label}?`) && write(null)}>Delete {label}</Button>}
        </div>
      )}
    </>
  );
}
