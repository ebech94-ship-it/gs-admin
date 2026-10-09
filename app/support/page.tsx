"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import AdminGate from "@/components/AdminGate";
import { db } from "@/lib/firebase";

type SupportTicket = {
  id: string;
  subject?: string;
  message?: string;
  category?: string;
  status?: string;
  priority?: string;
  userId?: string;
  passengerId?: string;
  userName?: string;
  passengerName?: string;
  email?: string;
  createdAt?: { toDate?: () => Date } | Date | string;
};

function SupportContent() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  async function loadTickets() {
    try {
      setLoading(true);
      setError("");
      const snapshot = await getDocs(collection(db, "support"));
      setTickets(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        })) as SupportTicket[]
      );
    } catch (err) {
      console.error("Support loading failed:", err);
      setError(
        "Unable to load support tickets. Confirm the Firestore collection name and permissions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const status = (ticket.status || "open").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !term ||
        [
          ticket.id,
          ticket.subject,
          ticket.message,
          ticket.category,
          ticket.userId,
          ticket.passengerId,
          ticket.userName,
          ticket.passengerName,
          ticket.email,
        ].some((value) => String(value || "").toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const openCount = tickets.filter((ticket) =>
    ["open", "new"].includes((ticket.status || "open").toLowerCase())
  ).length;

  const progressCount = tickets.filter((ticket) =>
    ["in_progress", "in progress", "processing"].includes(
      (ticket.status || "").toLowerCase()
    )
  ).length;

  const resolvedCount = tickets.filter((ticket) =>
    ["resolved", "closed"].includes((ticket.status || "").toLowerCase())
  ).length;

  async function updateStatus(ticket: SupportTicket, status: string) {
    try {
      setUpdatingId(ticket.id);
      setError("");
      await updateDoc(doc(db, "support", ticket.id), {
        status,
        updatedAt: serverTimestamp(),
      });
      setTickets((current) =>
        current.map((item) =>
          item.id === ticket.id ? { ...item, status } : item
        )
      );
    } catch (err) {
      console.error("Support status update failed:", err);
      setError("Could not update ticket status. Check Firestore permissions.");
    } finally {
      setUpdatingId("");
    }
  }

  function formatDate(value: SupportTicket["createdAt"]) {
    if (!value) return "—";
    try {
      const date =
        value instanceof Date
          ? value
          : typeof value === "string"
          ? new Date(value)
          : typeof value.toDate === "function"
          ? value.toDate()
          : null;

      return date && !Number.isNaN(date.getTime())
        ? date.toLocaleString()
        : "—";
    } catch {
      return "—";
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F6FB] p-4 text-[#06152B] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#1976D2]">
              GODSPEED MOBILITY
            </p>
            <h1 className="mt-1 text-3xl font-bold">Support Centre</h1>
            <p className="mt-2 text-sm text-slate-500">
              Monitor passenger and operator issues across the network.
            </p>
          </div>
          <Link
            href="/"
            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
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
          <Stat label="Open Tickets" value={openCount} loading={loading} />
          <Stat label="In Progress" value={progressCount} loading={loading} />
          <Stat label="Resolved / Closed" value={resolvedCount} loading={loading} />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ticket, passenger, subject..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="new">New</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={() => void loadTickets()}
              className="rounded-xl bg-[#06152B] px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="font-bold">Support Tickets</h2>
            <span className="text-xs text-slate-500">
              {filteredTickets.length} tickets
            </span>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">
              Loading support tickets...
            </p>
          ) : filteredTickets.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-semibold">No support tickets found</p>
              <p className="mt-1 text-sm text-slate-500">
                Tickets will appear here once the app writes them to the
                support collection.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredTickets.map((ticket) => {
                const status = (ticket.status || "open").toLowerCase();
                const statusStyle =
                  ["resolved", "closed"].includes(status)
                    ? "bg-emerald-50 text-emerald-700"
                    : ["in_progress", "in progress", "processing"].includes(status)
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700";

                return (
                  <article
                    key={ticket.id}
                    className="rounded-2xl border border-slate-100 p-4 transition hover:border-blue-100"
                  >
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">
                            {ticket.subject || ticket.category || "Support request"}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle}`}
                          >
                            {status.replaceAll("_", " ")}
                          </span>
                          {ticket.priority && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                              {ticket.priority} priority
                            </span>
                          )}
                        </div>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                          {ticket.message || "No message provided."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            From: {ticket.userName || ticket.passengerName || ticket.email || ticket.userId || ticket.passengerId || "Unknown"}
                          </span>
                          <span>Category: {ticket.category || "General"}</span>
                          <span>Created: {formatDate(ticket.createdAt)}</span>
                          <span>ID: {ticket.id}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <select
                          value={status}
                          disabled={updatingId === ticket.id}
                          onChange={(event) =>
                            void updateStatus(ticket, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
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

export default function SupportPage() {
  return (
    <AdminGate>
      <SupportContent />
    </AdminGate>
  );
}