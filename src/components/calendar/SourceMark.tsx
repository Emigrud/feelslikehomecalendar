import { cn } from "@/lib/utils";
import type { Source } from "@/lib/calendar";

/**
 * Tiny platform marks used in day cells, the day popup and the legend.
 * Abstract shapes in each platform's colour — not the platforms' own artwork.
 */
export function SourceMark({ source, className }: { source: Source; className?: string }) {
  return source === "airbnb" ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-3 w-3 shrink-0", className)}>
      <rect width="24" height="24" rx="7" className="fill-brand-airbnb" />
      <path
        d="M7.6 17.4v-5a4.4 4.4 0 0 1 8.8 0v5"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        className="stroke-brand-airbnb-ink"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("h-3 w-3 shrink-0", className)}>
      <rect width="24" height="24" rx="7" className="fill-brand-booking" />
      <path d="M9.6 5.6v12.8" strokeWidth="2.6" strokeLinecap="round" fill="none" className="stroke-brand-booking-ink" />
      <circle cx="13.2" cy="14" r="3.3" fill="none" strokeWidth="2.4" className="stroke-brand-booking-ink" />
    </svg>
  );
}
