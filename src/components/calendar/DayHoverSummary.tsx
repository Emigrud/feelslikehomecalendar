import { dayComment, formatShort, nights, sourceName, type DayInfo } from "@/lib/calendar";
import { SourceMark } from "./SourceMark";

export function DayHoverSummary({ info }: { info: DayInfo }) {
  return (
    <div className="space-y-3 text-sm">
      {info.reservations.map((r) => {
        const n = nights(r);
        const kids = r.kidsAges ?? [];
        const comment = dayComment(r, info);
        return (
          <div key={r.id} className="space-y-1">
            <p className="flex items-center gap-1.5 font-semibold">
              {r.isBlocked ? "Blocked" : <><SourceMark source={r.source} className="h-3.5 w-3.5" />{sourceName(r.source)}</>}
            </p>
            <p className="text-muted-foreground">{formatShort(r.checkIn)} → {formatShort(r.checkOut)}, {n} {n === 1 ? "night" : "nights"}</p>
            {!r.isBlocked && (r.adults == null
              ? <p className="font-medium text-warning-foreground">Guest numbers not filled in yet</p>
              : <p>{r.adults} {r.adults === 1 ? "adult" : "adults"}{kids.length > 0 && `, ${kids.length} ${kids.length === 1 ? "kid" : "kids"} (${kids.join(", ")})`}</p>)}
            {!r.isBlocked && r.guestName && <p>{r.guestName}</p>}
            {comment && <div className="rounded-md border-l-4 border-comment-border bg-comment px-2 py-1 text-comment-foreground">{comment}</div>}
          </div>
        );
      })}
    </div>
  );
}
