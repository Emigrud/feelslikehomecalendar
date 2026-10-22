import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/jobs/calendar-sync")({
  server: { handlers: { POST: async ({ request }) => {
    const authFailure = await authenticateCronRequest(request);
    if (authFailure) return authFailure;
    const body = await request.json().catch(() => null);
    if (body?.kind !== "calendar-sync") return new Response("Invalid job", { status: 400 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { syncApartment } = await import("@/lib/calendar-sync.server");
    const { data, error } = await supabaseAdmin.from("apartments").select("id, airbnb_ical_url, booking_ical_url").or("airbnb_ical_url.not.is.null,booking_ical_url.not.is.null");
    if (error) return new Response("Sync unavailable", { status: 500 });
    let failed = 0;
    for (const apartment of data ?? []) {
      try { const result = await syncApartment(supabaseAdmin, apartment); if (result.error) failed++; }
      catch { failed++; }
    }
    return Response.json({ success: failed === 0, processed: data?.length ?? 0, failed });
  } } },
});