import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatShort, nights, sourceName, type DayInfo, type Reservation } from "@/lib/calendar";
import { cn } from "@/lib/utils";

interface Props {
  info: DayInfo | null;
  onClose: () => void;
}

export function DayDetails({ info, onClose }: Props) {
  const isMobile = useIsMobile();
  const open = !!info;
  const title = info ? formatShort(info.date) : "";
  const body = info && (
    <div className="space-y-4 px-4 pb-6 sm:px-0 sm:pb-0">
      {info.reservations.map((r) => (
        <ReservationCard key={r.id} r={r} role={r === info.checkOut ? "out" : r === info.checkIn ? "in" : "stay"} />
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
};

function ReservationCard({ r, role }: { r: Reservation; role: keyof typeof ROLE }) {
  const kids = r.kidsAges ?? [];
  const missing = r.adults == null;
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 text-base">
      <div className="flex items-center justify-between gap-2">
        <span className={cn("rounded-md px-2 py-1 text-sm font-bold", ROLE[role].cls)}>{ROLE[role].label}</span>
        <span className="font-semibold text-muted-foreground">{sourceName(r.source)}</span>
      </div>
      <p className="text-lg font-semibold">
        {formatShort(r.checkIn)} → {formatShort(r.checkOut)}, {nights(r)} {nights(r) === 1 ? "night" : "nights"}
      </p>
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
    </div>
  );
}
