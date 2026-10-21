import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rowToReservation } from "./reservation-row";
import { sampleReservations } from "./sample-data";

/** Load (or create on first sign-in) the owner's apartment with its reservations. */
async function loadApartment() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in");
  const uid = userData.user.id;

  let { data: apt, error } = await supabase.from("apartments").select("id, name").eq("owner_id", uid).maybeSingle();
  if (error) throw error;
  if (!apt) {
    const ins = await supabase.from("apartments").insert({ owner_id: uid }).select("id, name").single();
    if (ins.error) throw ins.error;
    apt = ins.data;
  }

  const res = await supabase
    .from("reservations")
    .select("id, source, check_in, check_out, guest_name, adults, kids_ages, comment, status, is_blocked")
    .eq("apartment_id", apt.id)
    .order("check_in");
  if (res.error) throw res.error;

  return { id: apt.id, name: apt.name, reservations: (res.data ?? []).map(rowToReservation) };
}

export const apartmentQuery = queryOptions({ queryKey: ["apartment"], queryFn: loadApartment });

/** Insert demo bookings so the calendar can be previewed before calendar links exist. */
export async function addDemoBookings(apartmentId: string) {
  const rows = sampleReservations().map((r) => ({
    apartment_id: apartmentId,
    source: r.source,
    external_uid: `demo-${r.id}`,
    check_in: r.checkIn,
    check_out: r.checkOut,
    guest_name: r.guestName ?? null,
    adults: r.adults ?? null,
    kids_ages: r.kidsAges ?? [],
    comment: r.comment ?? null,
    is_blocked: r.isBlocked,
  }));
  const { error } = await supabase.from("reservations").upsert(rows, { onConflict: "apartment_id,source,external_uid" });
  if (error) throw error;
}
