"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGate from "@/components/AdminGate";

const navigation = [
  { name: "Dashboard", href: "/", icon: "⌂" },
  { name: "Operators", href: "/operators", icon: "◉" },
  { name: "Vehicles", href: "/vehicles", icon: "▣" },
  { name: "Trips", href: "/trips", icon: "→" },
  { name: "Bookings", href: "/bookings", icon: "▤" },
  { name: "Passengers", href: "/passengers", icon: "♙" },
  { name: "Revenue", href: "/revenue", icon: "◈" },
  { name: "Locations", href: "/locations", icon: "⌖" },
  { name: "Support", href: "/support", icon: "?" },
  { name: "Staff", href: "/staff", icon: "♟" },
  { name: "Settings", href: "/settings", icon: "⚙" },
];

function Dashboard() {
  const [drawerOpen, setDrawerOpen] = useState(false);
const [stats, setStats] = useState({
  operators: 0,
  vehicles: 0,
  trips: 0,
  bookings: 0,
});

useEffect(() => {
  async function loadStats() {
    try {
      const [operators, vehicles, trips, bookings] =
        await Promise.all([
          getCountFromServer(collection(db, "operators")),
          getCountFromServer(collection(db, "vehicles")),
          getCountFromServer(collection(db, "trips")),
          getCountFromServer(collection(db, "bookings")),
        ]);

      setStats({
        operators: operators.data().count,
        vehicles: vehicles.data().count,
        trips: trips.data().count,
        bookings: bookings.data().count,
      });
    } catch (error) {
      console.error("DASHBOARD STATS ERROR:", error);
    }
  }

  loadStats();
}, []);

  return (
    <div className="min-h-screen bg-[#F3F6FB] text-[#06152B]">

      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#06152B] text-white border-b border-white/10">
        <div className="h-16 px-4 flex items-center justify-between">

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-xl"
          >
            ☰
          </button>

          <div className="flex items-center gap-2">
            <Image
              src="/bus.png"
              alt="GodSpeed"
              width={48}
              height={32}
              className="object-contain"
            />

            <div>
              <p className="font-black text-sm tracking-wide">GODSPEED</p>
              <p className="text-[9px] text-[#4DA3FF] tracking-[0.2em]">
                MOBILITY ADMIN
              </p>
            </div>
          </div>

          <div className="w-11 h-11 rounded-xl bg-[#1976D2] flex items-center justify-center font-bold">
            A
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">

          <button
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside className="relative w-[285px] h-full bg-[#06152B] text-white shadow-2xl p-5 overflow-y-auto">

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Image
                  src="/bus.png"
                  alt="GodSpeed"
                  width={65}
                  height={42}
                  className="object-contain"
                />

                <div>
                  <p className="font-black">GODSPEED</p>
                  <p className="text-[9px] text-[#4DA3FF] tracking-widest">
                    MOBILITY
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="text-slate-400 text-xl"
              >
                ×
              </button>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition ${
                    item.name === "Dashboard"
                      ? "bg-[#1976D2] text-white"
                      : "text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  <span className="font-medium text-sm">
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[255px] bg-[#06152B] text-white flex-col">

        <div className="px-6 py-7 border-b border-white/10">
          <Image
            src="/bus.png"
            alt="GodSpeed Mobility"
            width={150}
            height={75}
            className="object-contain mx-auto"
          />

          <div className="text-center mt-2">
            <p className="font-black tracking-[0.15em]">
              GODSPEED
            </p>

            <p className="text-[#4DA3FF] text-xs font-bold tracking-[0.3em]">
              MOBILITY ADMIN
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition ${
                item.name === "Dashboard"
                  ? "bg-[#1976D2] text-white shadow-lg shadow-[#1976D2]/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="text-sm font-medium">
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-xs text-slate-400">
              GODSPEED TECHNOLOGIES
            </p>
            <p className="text-xs text-[#4DA3FF] mt-1">
              Mobility Network
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="lg:ml-[255px]">

        {/* DESKTOP HEADER */}
        <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8">

          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#1976D2] uppercase">
              Command Center
            </p>

            <h1 className="text-2xl font-black mt-1">
              Mobility Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50">
              🔔
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-[#06152B] text-white flex items-center justify-center font-bold">
                A
              </div>

              <div>
                <p className="text-sm font-bold">Administrator</p>
                <p className="text-xs text-slate-400">
                  GodSpeed Admin
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto">

          <div className="lg:hidden mb-6">
            <p className="text-xs font-bold tracking-[0.18em] text-[#1976D2] uppercase">
              Command Center
            </p>

            <h1 className="text-2xl font-black mt-1">
              Mobility Overview
            </h1>
          </div>

          {/* WELCOME CARD */}
          <section className="relative overflow-hidden rounded-3xl bg-[#06152B] text-white p-6 sm:p-8 mb-6 shadow-xl">

            <div className="relative z-10 max-w-xl">
              <p className="text-[#4DA3FF] text-xs font-bold tracking-[0.2em] uppercase">
                GODSPEED MOBILITY
              </p>

              <h2 className="text-2xl sm:text-3xl font-black mt-2">
                Welcome to the Command Center.
              </h2>

              <p className="text-slate-400 text-sm mt-3 leading-6">
                Manage operators, vehicles, trips, bookings and the
                growing GodSpeed Mobility network from one place.
              </p>
            </div>

            <Image
              src="/bus.png"
              alt=""
              width={280}
              height={150}
              className="absolute right-[-35px] bottom-[-15px] opacity-20 object-contain hidden sm:block"
            />
          </section>

          {/* STAT CARDS */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">

            {[
  ["Operators", String(stats.operators), "Registered operators"],
  ["Vehicles", String(stats.vehicles), "Registered fleet"],
  ["Trips", String(stats.trips), "Scheduled journeys"],
  ["Bookings", String(stats.bookings), "Passenger bookings"],
].map(([title, value, subtitle]) => (
              <div
                key={title}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm"
              >
                <p className="text-xs font-semibold text-slate-500">
                  {title}
                </p>

                <p className="text-2xl sm:text-3xl font-black text-[#06152B] mt-2">
                  {value}
                </p>

                <p className="text-[11px] text-slate-400 mt-1">
                  {subtitle}
                </p>
              </div>
            ))}
          </section>

          {/* LOWER PANELS */}
          <section className="grid lg:grid-cols-3 gap-5 mt-6">

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-lg">
                    Network Activity
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Your mobility network at a glance
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#1976D2] text-xs font-bold">
                  Live
                </span>
              </div>

              <div className="rounded-2xl bg-[#F3F6FB] border border-slate-100 p-8 text-center">
                <p className="text-3xl mb-2">◈</p>

                <p className="font-semibold">
                  Network activity will appear here
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Once operators and trips are connected.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">

              <h3 className="font-bold text-lg">
                Quick Actions
              </h3>

              <p className="text-xs text-slate-400 mt-1 mb-5">
                Common administration tasks
              </p>

              <div className="space-y-3">

                <Link
                  href="/operators"
                  className="flex items-center justify-between p-4 rounded-xl bg-[#F3F6FB] hover:bg-blue-50 border border-slate-100 transition"
                >
                  <span className="font-semibold text-sm">
                    Review Operators
                  </span>

                  <span className="text-[#1976D2]">→</span>
                </Link>

                <Link
                  href="/trips"
                  className="flex items-center justify-between p-4 rounded-xl bg-[#F3F6FB] hover:bg-blue-50 border border-slate-100 transition"
                >
                  <span className="font-semibold text-sm">
                    View Trips
                  </span>

                  <span className="text-[#1976D2]">→</span>
                </Link>

                <Link
                  href="/support"
                  className="flex items-center justify-between p-4 rounded-xl bg-[#F3F6FB] hover:bg-blue-50 border border-slate-100 transition"
                >
                  <span className="font-semibold text-sm">
                    Support Center
                  </span>

                  <span className="text-[#1976D2]">→</span>
                </Link>

              </div>
            </div>
          </section>

          <footer className="text-center py-8">
            <p className="text-[10px] text-slate-400 tracking-[0.2em]">
              GODSPEED TECHNOLOGIES • MOBILITY NETWORK
            </p>
          </footer>

        </div>
      </main>
    </div>
  );
}

export default function AdminHome() {
  return (
    <AdminGate>
      <Dashboard />
    </AdminGate>
  );
}