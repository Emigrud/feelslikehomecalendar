import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hasDayComment, dayInfo, guestLabel, monthGrid, toKey, type DayInfo, type Reservation } from "@/lib/calendar";
import { SourceMark } from "./SourceMark";
import { CommentMark } from "./CommentMark";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DayHoverSummary } from "./DayHoverSummary";
import type { DayKind } from "@/lib/calendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOVER_KINDS: DayKind[] = ["checkin", "checkout", "changeover", "checkout-blocked", "blocked"];

interface Props {
  year: number;
  month: number;
  reservations: Reservation[];
  onChangeMonth: (year: number, month: number) => void;
  onSelectDay: (info: DayInfo) => void;
}

export function MonthCalendar({ year, month, reservations, onChangeMonth, onSelectDay }: Props) {
  const todayKey = toKey(new Date());
  const days = monthGrid(year, month);
  const title = new Date(year, month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onChangeMonth(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-semibold capitalize">{title}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft /></Button>
          <Button variant="outline" onClick={() => { const n = new Date(); onChangeMonth(n.getFullYear(), n.getMonth()); }}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month"><ChevronRight /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((w) => <div key={w} className="py-1">{w}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const key = toKey(date);
          const info = dayInfo(key, reservations);
          const inMonth = date.getMonth() === month;
          const tappable = true;
          const cell = (
            <button
              key={key}
              type="button"
              disabled={!tappable}
              onClick={() => onSelectDay(info)}
              aria-label={`${date.getDate()} ${info.kind}`}
              className={cn(
                "day-cell relative flex min-h-14 flex-col items-start justify-between overflow-hidden rounded-md border p-1 text-left sm:min-h-20 sm:p-1.5",
                `day-${info.kind}`,
                !inMonth && "opacity-40",
                key === todayKey && "ring-[1.5px] ring-foreground/70 ring-offset-1 ring-offset-background",
                tappable && "cursor-pointer active:scale-[0.97] transition-transform",
              )}
            >
              <span className="relative z-10 text-sm font-bold leading-none sm:text-base">{date.getDate()}</span>
              <CellBadges info={info} />
              {hasDayComment(info) && <CommentMark className="absolute right-1 top-1 z-10" />}
            </button>
          );
          if (!HOVER_KINDS.includes(info.kind) || info.reservations.length === 0) return cell;
          return (
            <HoverCard key={key} openDelay={150} closeDelay={100}>
              <HoverCardTrigger asChild>{cell}</HoverCardTrigger>
              <HoverCardContent className="w-64 p-3"><DayHoverSummary info={info} /></HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
}

function Tag({ r }: { r: Reservation }) {
  const label = guestLabel(r);
  return (
    <span className={cn("flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-bold leading-tight sm:text-xs bg-cell-tag text-cell-tag-foreground", label === "?" && "bg-warning text-warning-foreground")}>
      <SourceMark source={r.source} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      {label}
    </span>
  );
}

function CellBadges({ info }: { info: DayInfo }) {
  if (info.kind === "changeover" && info.checkOut && info.checkIn) {
    return (
      <div className="relative z-10 flex w-full flex-col items-end gap-0.5">
        <Tag r={info.checkIn} />
      </div>
    );
  }
  const r = info.checkIn ?? info.checkOut ?? info.staying;
  if (!r) return null;
  return <div className="relative z-10"><Tag r={r} /></div>;
}
