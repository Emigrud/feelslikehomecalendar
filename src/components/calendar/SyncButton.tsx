import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncOwnerCalendar } from "@/lib/calendar-settings.functions";

export function SyncButton({ disabled = false }: { disabled?: boolean }) {
  const client = useQueryClient();
  const runSync = useServerFn(syncOwnerCalendar);
  const sync = useMutation({
    mutationFn: () => runSync(),
    onSuccess: async (result) => {
      await Promise.all([client.invalidateQueries({ queryKey: ["apartment"] }), client.invalidateQueries({ queryKey: ["calendar-settings"] })]);
      if (result.error) toast.error(result.error);
      else toast.success(`Calendar synced · ${result.imported} active ${result.imported === 1 ? "entry" : "entries"}`);
    },
    onError: () => toast.error("Couldn't sync the calendar. Please try again."),
  });
  return <Button type="button" variant="outline" size="sm" disabled={disabled || sync.isPending} onClick={() => sync.mutate()}><RefreshCw className={sync.isPending ? "animate-spin motion-reduce:animate-none" : ""} />{sync.isPending ? "Syncing…" : "Sync now"}</Button>;
}