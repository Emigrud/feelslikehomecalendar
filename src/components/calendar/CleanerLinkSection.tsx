import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCleanerToken, regenerateCleanerToken } from "@/lib/cleaner.functions";
import { cleanerLink } from "@/lib/cleaner-link";

export function CleanerLinkSection() {
  const load = useServerFn(getCleanerToken);
  const regen = useServerFn(regenerateCleanerToken);
  const [token, setToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setOrigin(window.location.origin); load().then((r) => setToken(r.token)).catch(() => toast.error("Couldn't load the cleaner link.")); }, [load]);
  const link = token && origin ? cleanerLink(origin, token) : "";
  const isPreview = origin.includes("preview");

  async function makeNew() {
    if (!confirm("Make a new link? The old link will stop working.")) return;
    setBusy(true);
    try { setToken((await regen()).token); toast.success("New link ready"); }
    catch { toast.error("Couldn't make a new link."); }
    finally { setBusy(false); }
  }

  return (
    <section className="mt-8 space-y-3 border-t pt-6">
      <h2 className="font-display text-xl font-semibold">Cleaner link</h2>
      <p className="text-sm text-muted-foreground">Anyone with this link can view the calendar (no editing, no login).</p>
      {isPreview && <p className="rounded-md bg-comment p-3 text-sm text-comment-foreground">This is your private test version. Open Settings in the published app to copy the link for your cleaner.</p>}
      <Input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Cleaner link" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={!link} onClick={async () => { await navigator.clipboard.writeText(link); toast.success("Link copied"); }}><Copy />Copy</Button>
        <Button size="sm" variant="outline" disabled={busy || !token} onClick={makeNew}><RefreshCw />Make a new link</Button>
      </div>
    </section>
  );
}
