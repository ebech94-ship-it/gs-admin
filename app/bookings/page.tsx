"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGate from "@/components/AdminGate";

type Booking = {
  id: string;
  passengerId?: string;
  passengerName?: string;
  passengerPhone?: string;
  operatorId?: string;
  tripId?: string;
  from?: string;
  to?: string;
  date?: string;
  departure?: string;
  arrival?: string;
  passengers?: number;
  seats?: string;
  pricePerPassenger?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  bookingStatus?: string;
  bookingReference?: string;
};

type Operator = {
  id: string;
  name?: string;
  displayName?: string;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [bookingSnapshot, operatorSnapshot] = await Promise.all([
        getDocs(collection(db, "bookings")),
        getDocs(collection(db, "operators")),
      ]);

      setBookings(
        bookingSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Booking[]
      );

      setOperators(
        operatorSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Operator[]
      );
    } catch (err) {
      console.error("ADMIN BOOKINGS LOAD ERROR:", err);
      setError("Could not load bookings. Check admin login and Firestore permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const operatorNames = useMemo(
    () =>
      new Map(
        operators.map((operator) => [
          operator.id,
          operator.displayName || operator.name || "Unnamed operator",
        ])
      ),
    [operators]
  );

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const operator =
        operatorNames.get(booking.operatorId || "") ||
        booking.operatorId ||
        "";

      const matchesSearch = [
        booking.bookingReference,
        booking.passengerName,
        booking.passengerPhone,
        booking.from,
        booking.to,
        booking.date,
        booking.operatorId,
        operator,
        booking.tripId,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const status = (booking.bookingStatus || "unknown").toLowerCase();
      const payment = (booking.paymentStatus || "unknown").toLowerCase();

      const matchesFilter =
        filter === "all" ||
        (filter === "confirmed" && status === "confirmed") ||
        (filter === "cancelled" && status === "cancelled") ||
        (filter === "paid" && payment === "paid") ||
        (filter === "unpaid" && payment !== "paid");

      return matchesSearch && matchesFilter;
    });
  }, [bookings, operatorNames, search, filter]);

  const totalRevenue = bookings
    .filter((booking) => booking.paymentStatus?.toLowerCase() === "paid")
    .reduce((sum, booking) => sum + (Number(booking.totalAmount) || 0), 0);

  const confirmedCount = bookings.filter(
    (booking) => booking.bookingStatus?.toLowerCase() === "confirmed"
  ).length;

  const paidCount = bookings.filter(
    (booking) => booking.paymentStatus?.toLowerCase() === "paid"
  ).length;

  return (
    <AdminGate>
      <main className="min-h-screen bg-[#F3F6FB] px-4 py-6 text-[#06152B] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="text-sm font-semibold text-[#1976D2] hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-[#1976D2]">
                NETWORK MANAGEMENT
              </p>
              <h1 className="mt-1 text-3xl font-black">Bookings & Reservations</h1>
              <p className="mt-2 text-sm text-slate-500">
                Monitor passenger reservations and recorded payment statuses.
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-xl bg-[#06152B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Bookings"}
            </button>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total Bookings", value: bookings.length.toLocaleString() },
              { label: "Confirmed", value: confirmedCount.toLocaleString() },
              { label: "Paid Bookings", value: paidCount.toLocaleString() },
              { label: "Recorded Paid Amount", value: `${totalRevenue.toLocaleString()} FCFA` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 break-words text-2xl font-black">{item.value}</p>
              </div>
            ))}
          </section>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, passenger, route or operator..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            >
              <option value="all">All bookings</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / other</option>
            </select>
          </section>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-white p-12 text-center text-sm text-slate-500">
              Loading bookings...
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <p className="text-4xl">🎫</p>
              <h2 className="mt-4 text-xl font-extrabold">
                {bookings.length === 0 ? "No bookings yet" : "No matching bookings"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {bookings.length === 0
                  ? "Passenger reservations will appear here when saved to Firestore."
                  : "Try another search or filter."}
              </p>
            </div>
          ) : (
            <section className="mt-6 space-y-4">
              {filteredBookings.map((booking) => {
                const operator =
                  operatorNames.get(booking.operatorId || "") ||
                  booking.operatorId ||
                  "Operator not matched";

                const bookingStatus = booking.bookingStatus || "Unknown";
                const paymentStatus = booking.paymentStatus || "Unknown";

                return (
                  <article
                    key={booking.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-bold tracking-wide text-[#1976D2]">
                          {booking.bookingReference || booking.id}
                        </p>
                        <h2 className="mt-2 break-words text-xl font-black">
                          {booking.from || "—"} → {booking.to || "—"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {booking.date || "Date not set"} · {booking.departure || "—"} – {booking.arrival || "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {bookingStatus.toUpperCase()}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          paymentStatus.toLowerCase() === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl bg-[#F3F6FB] p-4">
                        <p className="text-xs text-slate-500">Passenger</p>
                        <p className="mt-1 break-words text-sm font-bold">
                          {booking.passengerName || "Name unavailable"}
                        </p>
                        <p className="mt-1 break-words text-xs text-slate-500">
                          {booking.passengerPhone || "Phone unavailable"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F3F6FB] p-4">
                        <p className="text-xs text-slate-500">Operating Company</p>
                        <p className="mt-1 break-words text-sm font-bold">{operator}</p>
                        <p className="mt-1 break-all text-[10px] text-slate-400">
                          {booking.operatorId || "No operator ID"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F3F6FB] p-4">
                        <p className="text-xs text-slate-500">Passengers / Seats</p>
                        <p className="mt-1 text-sm font-bold">
                          {booking.passengers ?? 1} passenger(s)
                        </p>
                        <p className="mt-1 break-words text-xs text-slate-500">
                          Seats: {booking.seats || "Not provided"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F3F6FB] p-4">
                        <p className="text-xs text-slate-500">Total Amount</p>
                        <p className="mt-1 text-lg font-black text-[#1976D2]">
                          {(Number(booking.totalAmount) || 0).toLocaleString()} FCFA
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {(booking.paymentMethod || "Unknown method").toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="break-all text-xs text-slate-400">
                        Booking ID: {booking.id}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-400">
                        Trip ID: {booking.tripId || "Not linked"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </AdminGate>
  );
}