const ITEMS = [
  { cls: "day-checkin", label: "Check-in" },
  { cls: "day-checkout", label: "Check-out" },
  { cls: "day-changeover", label: "Out + in same day" },
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
      <p className="text-muted-foreground">A = Airbnb · B = Booking.com · "2+1" = adults + kids · "?" = guest numbers not filled in</p>
    </div>
  );
}
