import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type View = "calendar" | "cleanings";
const KEY = "cleaning-calendar-view";

/** Remembers this device's last chosen view; read after hydration. */
export function useSavedView() {
  const [view, setView] = useState<View>("calendar");
  useEffect(() => {
    if (localStorage.getItem(KEY) === "cleanings") setView("cleanings");
  }, []);
  const change = (v: View) => { setView(v); localStorage.setItem(KEY, v); };
  return [view, change] as const;
}

export function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div role="tablist" className="mb-4 grid grid-cols-2 rounded-lg border bg-muted p-1">
      {(["calendar", "cleanings"] as View[]).map((v) => (
        <button key={v} role="tab" aria-selected={view === v} onClick={() => onChange(v)}
          className={cn("rounded-md py-2 text-sm font-semibold capitalize", view === v ? "bg-background shadow-sm" : "text-muted-foreground")}>
          {v === "calendar" ? "Calendar" : "Cleanings"}
        </button>
      ))}
    </div>
  );
}
