import { queryOptions } from "@tanstack/react-query";
import { getCalendarSettings } from "./calendar-settings.functions";

export const calendarSettingsQuery = queryOptions({ queryKey: ["calendar-settings"], queryFn: () => getCalendarSettings() });

export function syncTime(value: string | null) {
  return value ? new Date(value).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not synced yet";
}