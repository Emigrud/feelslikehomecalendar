import { SourceMark } from "./SourceMark";
import { CommentMark } from "./CommentMark";

const ITEMS = [
  { cls: "day-checkin", label: "Check-in" },
  { cls: "day-checkout", label: "Check-out" },
  { cls: "day-changeover", label: "Out + in same day" },
  { cls: "day-checkout-blocked", label: "Out + blocked same day" },
  { cls: "day-staying", label: "Guests staying" },
  { cls: "day-blocked", label: "Blocked" },
];

export function Legend() {
  return (
    <div className="mt-4 space-y-2 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {ITEMS.map((i) => (
          <span key={i.label} className="flex items-center gap-2">
            <span className={`day-cell ${i.cls} relative inline-block h-5 w-5 overflow-hidden rounded border`} />
            {i.label}
          </span>
        ))}
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
        <span className="flex items-center gap-1.5"><SourceMark source="airbnb" className="h-3.5 w-3.5" /> Airbnb</span>
        <span className="flex items-center gap-1.5"><SourceMark source="booking" className="h-3.5 w-3.5" /> Booking.com</span>
        <span className="flex items-center gap-1.5"><CommentMark /> Comment added</span>
        <span>"2+1" = adults + kids</span>
        <span>"?" = guest numbers not filled in</span>
      </p>
    </div>
  );
}
