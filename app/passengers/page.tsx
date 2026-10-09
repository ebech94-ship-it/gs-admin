"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGate from "@/components/AdminGate";

type Passenger = {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
  verificationStatus?: string;
  verification?: string;
  createdAt?: { toDate?: () => Date } | Date | string;
};

type Booking = {
  passengerId?: string;
  totalAmount?: number;
  paymentStatus?: string;
};

export default function PassengersPage() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [userSnapshot, bookingSnapshot] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "bookings")),
      ]);

      setPassengers(
        userSnapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter((user) => {
            const data = user as Passenger;
            return !data.role || data.role === "passenger";
          }) as Passenger[]
      );

      setBookings(
        bookingSnapshot.docs.map((item) => item.data()) as Booking[]
      );
    } catch (err) {
      console.error("ADMIN PASSENGERS LOAD ERROR:", err);
      setError("Could not load passengers. Check admin login and Firestore permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const bookingCounts = useMemo(() => {
    const counts = new Map<string, number>();

    bookings.forEach((booking) => {
      if (booking.passengerId) {
        counts.set(
          booking.passengerId,
          (counts.get(booking.passengerId) || 0) + 1
        );
      }
    });

    return counts;
  }, [bookings]);

  const filteredPassengers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return passengers.filter((passenger) => {
      const name = passenger.fullName || passenger.name || "";
      const status = (passenger.accountStatus || "active").toLowerCase();
      const matchesSearch = [
        name,
        passenger.email,
        passenger.phone,
        passenger.id,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && status === "active") ||
        (filter === "inactive" && status !== "active") ||
        (filter === "verified" &&
          ["verified", "approved"].includes(
            (passenger.verificationStatus || passenger.verification || "").toLowerCase()
          ));

      return matchesSearch && matchesFilter;
    });
  }, [passengers, search, filter]);

  const activeCount = passengers.filter(
    (passenger) => (passenger.accountStatus || "active").toLowerCase() === "active"
  ).length;

  const totalPassengerBookings = bookings.length;

  function formatDate(value: Passenger["createdAt"]) {
    if (!value) return "Not available";

    try {
      let date: Date;

      if (typeof value === "object" && "toDate" in value && value.toDate) {
        date = value.toDate();
      } else {
        date = new Date(value as string | Date);
      }

      return Number.isNaN(date.getTime())
        ? "Not available"
        : date.toLocaleDateString();
    } catch {
      return "Not available";
    }
  }

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
              <h1 className="mt-1 text-3xl font-black">Passengers</h1>
              <p className="mt-2 text-sm text-slate-500">
                View passenger accounts and their booking activity.
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-xl bg-[#06152B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Passengers"}
            </button>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Passenger Accounts", value: passengers.length },
              { label: "Active Accounts", value: activeCount },
              { label: "Total Bookings", value: totalPassengerBookings },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black">{item.value.toLocaleString()}</p>
              </div>
            ))}
          </section>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone or user ID..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            >
              <option value="all">All passengers</option>
              <option value="active">Active accounts</option>
              <option value="inactive">Other account statuses</option>
              <option value="verified">Verified passengers</option>
            </select>
          </section>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-white p-12 text-center text-sm text-slate-500">
              Loading passenger accounts...
            </div>
          ) : filteredPassengers.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <p className="text-4xl">👤</p>
              <h2 className="mt-4 text-xl font-extrabold">
                {passengers.length === 0
                  ? "No passenger accounts found"
                  : "No matching passengers"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {passengers.length === 0
                  ? "Passenger profiles will appear here when available in Firestore."
                  : "Try another search or filter."}
              </p>
            </div>
          ) : (
            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPassengers.map((passenger) => {
                const name = passenger.fullName || passenger.name || "Unnamed passenger";
                const accountStatus = passenger.accountStatus || "active";
                const verification =
                  passenger.verificationStatus ||
                  passenger.verification ||
                  "Not provided";

                return (
                  <article
                    key={passenger.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F1FB] text-xl font-black text-[#1976D2]">
                        {name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="break-words text-lg font-extrabold">{name}</h2>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {passenger.email || "No email provided"}
                        </p>
                      </div>

                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        accountStatus.toLowerCase() === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {accountStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-500">Phone</span>
                        <span className="break-words text-right font-semibold">
                          {passenger.phone || "Not provided"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-500">Verification</span>
                        <span className="text-right font-semibold">
                          {verification}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-500">Bookings</span>
                        <span className="font-bold">
                          {bookingCounts.get(passenger.id) || 0}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-500">Joined</span>
                        <span className="text-right font-semibold">
                          {formatDate(passenger.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="break-all text-[10px] text-slate-400">
                        User ID: {passenger.id}
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