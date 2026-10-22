import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dateToISO, formatTyping, fromDisplayDate, isoToDate, toDisplayDate } from "@/lib/date-text";

interface Props {
  /** Database date (yyyy-mm-dd) currently chosen, or "" when nothing usable is typed yet. */
  value: string;
  onChange: (iso: string) => void;
  /** Earliest and latest database date the owner may pick, both included. */
  min: string;
  max: string;
  id?: string;
}

/** Date box the owner types into (yyyy/mm/dd) or fills from a month popup. */
export function SplitDateField({ value, onChange, min, max, id }: Props) {
  const [text, setText] = useState(() => toDisplayDate(value));
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => isoToDate(value || min));

  // A date set from outside (tapping another day) must appear in the box.
  useEffect(() => {
    if (value && fromDisplayDate(text) !== value) setText(toDisplayDate(value));
  }, [value, text]);

  const typed = fromDisplayDate(text);
  const outOfRange = !!typed && (typed < min || typed > max);
  const chosen = typed && !outOfRange ? typed : value;

  const pick = (date: Date | undefined) => {
    if (!date) return;
    const iso = dateToISO(date);
    setText(toDisplayDate(iso));
    onChange(iso);
    setOpen(false);
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          id={id}
          value={text}
          onChange={(e) => {
            const next = formatTyping(e.target.value);
            setText(next);
            const iso = fromDisplayDate(next);
            onChange(iso && iso >= min && iso <= max ? iso : "");
          }}
          placeholder="yyyy/mm/dd"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={outOfRange}
          className="pr-11 font-mono tracking-wide"
        />
        <Popover
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (o) setMonth(isoToDate(chosen || min));
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Choose a date from the calendar"
              className="absolute inset-y-0 right-0 h-auto px-3 text-muted-foreground"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={chosen ? isoToDate(chosen) : undefined}
              onSelect={pick}
              disabled={[{ before: isoToDate(min) }, { after: isoToDate(max) }]}
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>
      {outOfRange ? (
        <p className="text-sm font-semibold text-destructive">
          Must be between {toDisplayDate(min)} and {toDisplayDate(max)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Format: yyyy/mm/dd</p>
      )}
    </div>
  );
}
