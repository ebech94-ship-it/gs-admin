
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGate from "@/components/AdminGate";

type Vehicle = {
  id: string;
  operatorId?: string;
  operatorName?: string;
  name?: string;
  image?: string;
  plateNumber?: string;
  vehicleType?: string;
  capacity?: number;
  seatLayout?: unknown[];
  active?: boolean;
};

type Operator = {
  id: string;
  name?: string;
  displayName?: string;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
      const [vehicleSnapshot, operatorSnapshot] = await Promise.all([
        getDocs(collection(db, "vehicles")),
        getDocs(collection(db, "operators")),
      ]);

      setVehicles(
        vehicleSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Vehicle[]
      );

      setOperators(
        operatorSnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as Operator[]
      );
    } catch (err) {
      console.error("ADMIN VEHICLES LOAD ERROR:", err);
      setError(
        "Could not load vehicles. Check your admin login and Firestore permissions."
      );
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

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const operatorName =
        operatorNames.get(vehicle.operatorId || "") ||
        vehicle.operatorName ||
        "";

      const matchesSearch = [
        vehicle.name,
        vehicle.plateNumber,
        vehicle.vehicleType,
        vehicle.operatorId,
        operatorName,
      ].some((value) => String(value || "").toLowerCase().includes(term));

      const matchesStatus =
        filter === "all" ||
        (filter === "active" && vehicle.active === true) ||
        (filter === "inactive" && vehicle.active !== true);

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, operatorNames, search, filter]);

  async function toggleStatus(vehicle: Vehicle) {
    const nextActive = vehicle.active !== true;

    setUpdatingId(vehicle.id);
    setError("");

    try {
      await updateDoc(doc(db, "vehicles", vehicle.id), {
        active: nextActive,
      });

      setVehicles((current) =>
        current.map((item) =>
          item.id === vehicle.id
            ? { ...item, active: nextActive }
            : item
        )
      );
    } catch (err) {
      console.error("ADMIN VEHICLE STATUS ERROR:", err);
      setError("Could not update vehicle status. Please try again.");
    } finally {
      setUpdatingId("");
    }
  }

  const activeCount = vehicles.filter(
    (vehicle) => vehicle.active === true
  ).length;

  const inactiveCount = vehicles.length - activeCount;

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
              <h1 className="mt-1 text-3xl font-black">
                Vehicles & Fleet
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                View vehicles registered by operators across GodSpeed Mobility.
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-xl bg-[#06152B] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Fleet"}
            </button>
          </div>

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Total Vehicles", value: vehicles.length },
              { label: "Active Vehicles", value: activeCount },
              { label: "Inactive Vehicles", value: inactiveCount },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-black">
                  {item.value}
                </p>
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

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search vehicle, plate or operator..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
              />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
              >
                <option value="all">All vehicles</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </div>
          </section>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-white p-12 text-center text-sm text-slate-500">
              Loading fleet records...
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <div className="text-4xl">🚌</div>
              <h2 className="mt-4 text-xl font-extrabold">
                {vehicles.length === 0
                  ? "No vehicles registered yet"
                  : "No matching vehicles"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {vehicles.length === 0
                  ? "Vehicles registered through the Operator Portal will appear here."
                  : "Try another search term or change the status filter."}
              </p>
            </div>
          ) : (
            <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((vehicle) => {
                const operatorName =
                  operatorNames.get(vehicle.operatorId || "") ||
                  vehicle.operatorName ||
                  "Operator not matched";

                return (
                  <article
                    key={vehicle.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    {vehicle.image ? (
                      // Firebase Storage URLs may come from different hosts.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={vehicle.image}
                        alt={vehicle.name || "Vehicle"}
                        className="h-52 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center bg-[#06152B]">
                        <div className="text-center">
                          <p className="text-5xl">🚌</p>
                          <p className="mt-2 text-xs text-blue-200">
                            No vehicle photo
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="break-words text-xl font-extrabold">
                            {vehicle.name || "Unnamed vehicle"}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500">
                            {vehicle.vehicleType || "Vehicle"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
                            vehicle.active === true
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {vehicle.active === true ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl bg-[#F3F6FB] p-4">
                        <p className="text-xs font-semibold text-slate-500">
                          Registered Operator
                        </p>
                        <p className="mt-1 break-words text-sm font-bold">
                          {operatorName}
                        </p>
                        {vehicle.operatorId && (
                          <p className="mt-1 break-all text-[10px] text-slate-400">
                            ID: {vehicle.operatorId}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-xs text-slate-500">
                            Seat Capacity
                          </p>
                          <p className="mt-1 text-lg font-extrabold">
                            {vehicle.capacity ?? "—"}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-100 p-3">
                          <p className="text-xs text-slate-500">
                            Plate Number
                          </p>
                          <p className="mt-1 break-words text-sm font-bold">
                            {vehicle.plateNumber || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        Configured seats: {vehicle.seatLayout?.length ?? 0}
                      </p>

                      <button
                        onClick={() => void toggleStatus(vehicle)}
                        disabled={updatingId === vehicle.id}
                        className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-bold transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {updatingId === vehicle.id
                          ? "Updating..."
                          : vehicle.active === true
                            ? "Deactivate Vehicle"
                            : "Activate Vehicle"}
                      </button>
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
