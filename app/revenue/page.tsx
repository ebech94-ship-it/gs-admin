"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import AdminGate from "@/components/AdminGate";
import { db } from "@/lib/firebase";

type Payment = {
  id: string;
  bookingId?: string;
  passengerId?: string;
  operatorId?: string;
  tripId?: string;
  amount?: number;
  method?: string;
  status?: string;
  createdAt?: Timestamp | Date | string;
};

type Operator = {
  id: string;
  name?: string;
  operatorName?: string;
};

function RevenueContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [paymentSnap, operatorSnap] = await Promise.all([
          getDocs(collection(db, "payments")),
          getDocs(collection(db, "operators")),
        ]);

        setPayments(
          paymentSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Payment[]
        );

        setOperators(
          operatorSnap.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as Operator[]
        );
      } catch (err) {
        console.error("Revenue loading failed:", err);
        setError(
          "Unable to load payment records. Check Firestore permissions."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const operatorName = (operatorId?: string) => {
    if (!operatorId) return "—";
    const operator = operators.find((item) => item.id === operatorId);
    return operator?.name || operator?.operatorName || operatorId;
  };

  const paidPayments = useMemo(
    () =>
      payments.filter(
        (payment) => (payment.status || "").toLowerCase() === "paid"
      ),
    [payments]
  );

  const totalRecorded = useMemo(
    () =>
      paidPayments.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0
      ),
    [paidPayments]
  );

  const pendingCount = payments.filter(
    (payment) => (payment.status || "").toLowerCase() === "pending"
  ).length;

  const failedCount = payments.filter((payment) =>
    ["failed", "cancelled", "canceled"].includes(
      (payment.status || "").toLowerCase()
    )
  ).length;

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const status = (payment.status || "unknown").toLowerCase();
      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesSearch =
        !query ||
        [
          payment.id,
          payment.bookingId,
          payment.passengerId,
          payment.operatorId,
          payment.tripId,
          payment.method,
          payment.status,
        ].some((value) => String(value || "").toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

  const formatDate = (value?: Timestamp | Date | string) => {
    if (!value) return "—";

    try {
      const date =
        value instanceof Timestamp
          ? value.toDate()
          : value instanceof Date
          ? value
          : new Date(value);

      return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString();
    } catch {
      return "—";
    }
  };

  const money = (value: number) =>
    `${value.toLocaleString("en-US")} FCFA`;

  return (
    <main className="min-h-screen bg-[#F3F6FB] p-4 text-[#06152B] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-[#1976D2]">
              GODSPEED MOBILITY
            </p>
            <h1 className="mt-1 text-3xl font-bold">Revenue & Payments</h1>
            <p className="mt-2 text-sm text-slate-500">
              Review recorded payment transactions across the network.
            </p>
          </div>

          <Link
            href="/"
            className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50"
          >
            ← Dashboard
          </Link>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Recorded Paid Amount"
            value={money(totalRecorded)}
            detail="Payments marked paid"
            loading={loading}
          />
          <StatCard
            label="Paid Transactions"
            value={paidPayments.length.toLocaleString()}
            detail="Marked as paid"
            loading={loading}
          />
          <StatCard
            label="Pending Payments"
            value={pendingCount.toLocaleString()}
            detail="Awaiting payment"
            loading={loading}
          />
          <StatCard
            label="Failed / Cancelled"
            value={failedCount.toLocaleString()}
            detail="Unsuccessful records"
            loading={loading}
          />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search transaction, booking, passenger, operator..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#1976D2] focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#1976D2]"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="font-bold">Payment Transactions</h2>
            <span className="text-xs text-slate-500">
              {filteredPayments.length} records
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading payment records...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                ₣
              </div>
              <p className="mt-3 font-semibold">No payment records found</p>
              <p className="mt-1 text-sm text-slate-500">
                Transactions will appear here when they are recorded.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-3 font-semibold">Transaction</th>
                    <th className="px-3 py-3 font-semibold">Booking</th>
                    <th className="px-3 py-3 font-semibold">Operator</th>
                    <th className="px-3 py-3 font-semibold">Method</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const status = (payment.status || "unknown").toLowerCase();
                    const badgeClass =
                      status === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : ["failed", "cancelled", "canceled"].includes(status)
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600";

                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold">
                            {payment.id.slice(0, 12)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Passenger: {payment.passengerId || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-medium">
                            {payment.bookingId || "—"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Trip: {payment.tripId || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          {operatorName(payment.operatorId)}
                        </td>
                        <td className="px-3 py-4 capitalize">
                          {payment.method || "—"}
                        </td>
                        <td className="px-3 py-4 font-bold">
                          {money(Number(payment.amount || 0))}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs leading-5 text-slate-400">
          These figures reflect Firestore payment records marked as paid; they
          are not proof of settlement by a payment provider.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  detail,
  loading,
}: {
  label: string;
  value: string;
  detail: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 break-words text-2xl font-bold tracking-tight">
        {loading ? "..." : value}
      </p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

export default function RevenuePage() {
  return (
    <AdminGate>
      <RevenueContent />
    </AdminGate>
  );
}