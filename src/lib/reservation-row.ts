import type { Reservation } from "./calendar";

export interface ReservationRow {
  id: string;
  source: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  adults: number | null;
  kids_ages: number[] | null;
  comment: string | null;
  status: string;
  is_blocked: boolean;
}

/** Convert a database row into the calendar's Reservation shape. */
export function rowToReservation(r: ReservationRow): Reservation {
  return {
    id: r.id,
    source: r.source === "booking" ? "booking" : "airbnb",
    checkIn: r.check_in,
    checkOut: r.check_out,
    guestName: r.guest_name,
    adults: r.adults,
    kidsAges: r.kids_ages ?? [],
    comment: r.comment,
    status: r.status === "cancelled" ? "cancelled" : "active",
    isBlocked: r.is_blocked,
  };
}
