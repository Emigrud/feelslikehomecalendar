import { toKey, type Reservation } from "./calendar";

/** Sample bookings around the current month (Stage 1 only — replaced by real data later). */
export function sampleReservations(today = new Date()): Reservation[] {
  const d = (offset: number) => toKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset));
  return [
    { id: "1", source: "booking", checkIn: d(-6), checkOut: d(-2), guestName: "Anna Müller", adults: 2, kidsAges: [], status: "active", isBlocked: false },
    { id: "2", source: "airbnb", checkIn: d(-2), checkOut: d(2), adults: 2, kidsAges: [4, 7], comment: "Guests asked for a baby cot", status: "active", isBlocked: false },
    { id: "3", source: "booking", checkIn: d(2), checkOut: d(5), guestName: "Marco Rossi", adults: null, kidsAges: null, status: "active", isBlocked: false },
    { id: "4", source: "airbnb", checkIn: d(7), checkOut: d(9), status: "active", isBlocked: true },
    { id: "5", source: "airbnb", checkIn: d(11), checkOut: d(15), adults: 3, kidsAges: [], comment: "Late check-out at 14:00. Deep clean needed after this stay.", status: "active", isBlocked: false },
    { id: "6", source: "booking", checkIn: d(15), checkOut: d(18), guestName: "Jonas Petrauskas", adults: 1, kidsAges: [2], status: "active", isBlocked: false },
  ];
}
