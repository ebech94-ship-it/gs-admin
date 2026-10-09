"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGate from "@/components/AdminGate";

type Trip = {
  id: string;
  operatorId?: string;
  operatorName?: string;
  vehicleId?: string;
  from?: string;
  to?: string;
  departure?: string;
  arrival?: string;
  duration?: string;
  price?: number;
  date?: string;
  occupiedSeats?: string[];
  active?: boolean;
  status?: string;
};

type Operator = {
  id: string;
  name?: string;
  displayName?: string;
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [tripSnapshot, operatorSnapshot] = await Promise.all([
        getDocs(collection(db, "trips")),
        getDocs(collection(db, "operators")),
      ]);

      setTrips(
        tripSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Trip[]
      );

      setOperators(
        operatorSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Operator[]
      );
    } catch (err) {
      console.error("ADMIN TRIPS LOAD ERROR:", err);
      setError("Could not load trips. Check admin login and Firestore permissions.");
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

  const filteredTrips = useMemo(() => {
    const term = search.trim().toLowerCase();

    return trips.filter((trip) => {
      const operator =
        operatorNames.get(trip.operatorId || "") ||
        trip.operatorName ||
        trip.operatorId ||
        "";

      const matchesSearch = [
        trip.from,
        trip.to,
        trip.date,
        trip.vehicleId,
        trip.operatorId,
        operator,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const isActive =
        trip.active === true ||
        trip.status?.toLowerCase() === "active" ||
        trip.status?.toLowerCase() === "published";

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && isActive) ||
        (filter === "inactive" && !isActive);

      return matchesSearch && matchesFilter;
    });
  }, [trips, operatorNames, search, filter]);

  async function toggleTrip(trip: Trip) {
    const currentlyActive =
      trip.active === true ||
      trip.status?.toLowerCase() === "active" ||
      trip.status?.toLowerCase() === "published";

    const nextActive = !currentlyActive;

    setUpdatingId(trip.id);
    setError("");

    try {
      await updateDoc(doc(db, "trips", trip.id), {
        active: nextActive,
        updatedAt: new Date(),
      });

      setTrips((current) =>
        current.map((item) =>
          item.id === trip.id
            ? { ...item, active: nextActive }
            : item
        )
      );
    } catch (err) {
      console.error("ADMIN TRIP STATUS ERROR:", err);
      setError("Could not update trip status. Check Firestore permissions.");
    } finally {
      setUpdatingId("");
    }
  }

  const activeCount = trips.filter(
    (trip) =>
      trip.active === true ||
      trip.status?.toLowerCase() === "active" ||
      trip.status?.toLowerCase() === "published"
  ).length;

  const inactiveCount = trips.length - activeCount;

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
              <h1 className="mt-1 text-3xl font-black">Trips & Routes</h1>
              <p className="mt-2 text-sm text-slate-500">
                Monitor journeys published by operators across GodSpeed Mobility.
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-xl bg-[#06152B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Trips"}
            </button>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total Trips", value: trips.length },
              { label: "Active Trips", value: activeCount },
              { label: "Inactive Trips", value: inactiveCount },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black">{item.value}</p>
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
              placeholder="Search route, operator, vehicle or date..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            >
              <option value="all">All trips</option>
              <option value="active">Active trips</option>
              <option value="inactive">Inactive trips</option>
            </select>
          </section>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-white p-12 text-center text-sm text-slate-500">
              Loading trips...
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <p className="text-4xl">🚌</p>
              <h2 className="mt-4 text-xl font-extrabold">
                {trips.length === 0 ? "No trips registered yet" : "No matching trips"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {trips.length === 0
                  ? "Trips created through the Operator Portal will appear here."
                  : "Try another search or status filter."}
              </p>
            </div>
          ) : (
            <section className="mt-6 grid gap-5 lg:grid-cols-2">
              {filteredTrips.map((trip) => {
                const operator =
                  operatorNames.get(trip.operatorId || "") ||
                  trip.operatorName ||
                  trip.operatorId ||
                  "Operator not matched";

                const isActive =
                  trip.active === true ||
                  trip.status?.toLowerCase() === "active" ||
                  trip.status?.toLowerCase() === "published";

                return (
                  <article
                    key={trip.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold tracking-wide text-[#1976D2]">
                          {trip.date || "Date not set"}
                        </p>
                        <h2 className="mt-2 break-words text-xl font-black">
                          {trip.from || "—"} → {trip.to || "—"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {trip.departure || "—"} – {trip.arrival || "—"}
                          {trip.duration ? ` · ${trip.duration}` : ""}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#F3F6FB] p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Operating Company
                      </p>
                      <p className="mt-1 break-words text-sm font-bold">
                        {operator}
                      </p>
                      <p className="mt-1 break-all text-[10px] text-slate-400">
                        Operator ID: {trip.operatorId || "Not provided"}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 p-3">
                        <p className="text-xs text-slate-500">Ticket Price</p>
                        <p className="mt-1 text-lg font-extrabold text-[#1976D2]">
                          {typeof trip.price === "number"
                            ? `${trip.price.toLocaleString()} FCFA`
                            : "Not set"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 p-3">
                        <p className="text-xs text-slate-500">Occupied Seats</p>
                        <p className="mt-1 text-lg font-extrabold">
                          {trip.occupiedSeats?.length ?? 0}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-xl border border-slate-100 p-3">
                        <p className="text-xs text-slate-500">Vehicle ID</p>
                        <p className="mt-1 break-all text-sm font-bold">
                          {trip.vehicleId || "Not assigned"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => void toggleTrip(trip)}
                      disabled={updatingId === trip.id}
                      className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {updatingId === trip.id
                        ? "Updating..."
                        : isActive
                          ? "Deactivate Trip"
                          : "Activate Trip"}
                    </button>
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