"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AdminGate from "@/components/AdminGate";
import { db } from "@/lib/firebase";

type LocationItem = {
  id: string;
  name?: string;
  city?: string;
  region?: string;
  country?: string;
  active?: boolean;
};

function LocationsContent() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("Cameroon");

  async function loadLocations() {
    try {
      setLoading(true);
      setError("");
      const snapshot = await getDocs(collection(db, "locations"));
      setLocations(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as LocationItem[]
      );
    } catch (err) {
      console.error("Locations loading failed:", err);
      setError("Unable to load locations. Check your Firestore permissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLocations();
  }, []);

  const filtered = locations.filter((location) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = [
      location.name,
      location.city,
      location.region,
      location.country,
      location.id,
    ].some((value) => String(value || "").toLowerCase().includes(query));

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && location.active === true) ||
      (filter === "inactive" && location.active !== true);

    return matchesSearch && matchesFilter;
  });

  async function addLocation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError("");

      await addDoc(collection(db, "locations"), {
        name: name.trim(),
        city: name.trim(),
        region: region.trim(),
        country: country.trim() || "Cameroon",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName("");
      setRegion("");
      await loadLocations();
    } catch (err) {
      console.error("Adding location failed:", err);
      setError("Could not add location. Check Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleLocation(location: LocationItem) {
    try {
      setError("");
      await updateDoc(doc(db, "locations", location.id), {
        active: location.active !== true,
        updatedAt: serverTimestamp(),
      });
      await loadLocations();
    } catch (err) {
      console.error("Updating location failed:", err);
      setError("Could not update location status. Check Firestore permissions.");
    }
  }

  async function removeLocation(location: LocationItem) {
    const confirmed = window.confirm(
      `Delete "${location.name || location.city || location.id}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setError("");
      await deleteDoc(doc(db, "locations", location.id));
      await loadLocations();
    } catch (err) {
      console.error("Deleting location failed:", err);
      setError("Could not delete location. Check Firestore permissions.");
    }
  }

  const activeCount = locations.filter((item) => item.active === true).length;
  const inactiveCount = locations.length - activeCount;

  return (
    <main className="min-h-screen bg-[#F3F6FB] p-4 text-[#06152B] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#1976D2]">
              GODSPEED MOBILITY
            </p>
            <h1 className="mt-1 text-3xl font-bold">Locations</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage the departure and destination locations available across
              the network.
            </p>
          </div>
          <Link
            href="/"
            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="All Locations" value={locations.length} loading={loading} />
          <Stat label="Active" value={activeCount} loading={loading} />
          <Stat label="Inactive" value={inactiveCount} loading={loading} />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Add a Location</h2>
          <p className="mt-1 text-sm text-slate-500">
            New active locations can be used by connected operator forms that
            read the Firestore locations collection.
          </p>

          <form
            onSubmit={addLocation}
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="City / location name"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="Region (optional)"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Country"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#1976D2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "+ Add Location"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search city, region or country..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">All locations</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="font-bold">Network Locations</h2>
            <span className="text-xs text-slate-500">
              {filtered.length} locations
            </span>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Loading locations...
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              No locations found.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((location) => {
                const active = location.active === true;

                return (
                  <article
                    key={location.id}
                    className="rounded-2xl border border-slate-100 p-4 transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                          <span aria-hidden="true">📍</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="break-words font-bold">
                            {location.name || location.city || "Unnamed location"}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {[location.region, location.country]
                              .filter(Boolean)
                              .join(", ") || "Region not specified"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-3 break-all text-xs text-slate-400">
                      ID: {location.id}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => void toggleLocation(location)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                          active
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => void removeLocation(location)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold">{loading ? "..." : value}</p>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <AdminGate>
      <LocationsContent />
    </AdminGate>
  );
}