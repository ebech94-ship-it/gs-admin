
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import AdminGate from "@/components/AdminGate";
import { db } from "@/lib/firebase";

type OperatorApplication = {
  id: string;
  uid: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  businessAddress: string;
  operatingLocations: string[];
  vehicleCount: number;
  businessRegistrationNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: unknown;
  updatedAt?: unknown;
};

function OperatorsPage() {
  const [applications, setApplications] = useState<OperatorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const snapshot = await getDocs(
        collection(db, "operatorApplications")
      );

      const loaded = snapshot.docs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          uid: data.uid,
          companyName: data.companyName,
          contactName: data.contactName,
          phone: data.phone,
          email: data.email,
          businessAddress: data.businessAddress,
          operatingLocations: data.operatingLocations || [],
          vehicleCount: data.vehicleCount || 0,
          businessRegistrationNumber:
            data.businessRegistrationNumber,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as OperatorApplication;
      });

      loaded.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
      });

      setApplications(loaded);
    } catch {
      setError("Unable to load operator applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function approveOperator(application: OperatorApplication) {
    const confirmed = window.confirm(
      `Approve ${application.companyName} as a GodSpeed Mobility operator?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(application.id);
      setError("");

      const operatorId = `operator-${application.uid}`;

      const batch = writeBatch(db);

      // Update the original application.
      batch.update(doc(db, "operatorApplications", application.id), {
        status: "approved",
        updatedAt: serverTimestamp(),
      });

      // Create the profile expected by the Operator portal.
      batch.set(doc(db, "users", application.uid), {
        uid: application.uid,
        operatorId,
        role: "operator_admin",
        companyName: application.companyName,
        contactName: application.contactName,
        phone: application.phone,
        email: application.email,
        status: "active",
      });

      // Create the network-level operator record.
      batch.set(doc(db, "operators", operatorId), {
        id: operatorId,
        name: application.companyName,
        displayName: application.companyName,
        phone: application.phone,
        email: application.email,
        address: application.businessAddress,
        countryCode: "CM",
        verificationStatus: "verified",
        active: true,
      });

    console.log("APPROVING OPERATOR:", application);
console.log("COMMITTING APPROVAL...");

await batch.commit();

console.log("APPROVAL COMMITTED SUCCESSFULLY");

await loadApplications();
 } catch (error: any) {
  console.error("APPROVE OPERATOR ERROR:", error);
  console.error("ERROR CODE:", error?.code);
  console.error("ERROR MESSAGE:", error?.message);

  setError(
    `Approval failed: ${error?.code || "unknown"} — ${
      error?.message || "Unknown Firebase error"
    }`
  );
} finally {
  setProcessingId("");
}
  }

  async function rejectOperator(application: OperatorApplication) {
    const confirmed = window.confirm(
      `Reject ${application.companyName}'s operator application?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(application.id);
      setError("");

      await updateDoc(
        doc(db, "operatorApplications", application.id),
        {
          status: "rejected",
          updatedAt: serverTimestamp(),
        }
      );

      await loadApplications();
    } catch {
      setError("Unable to reject this operator.");
    } finally {
      setProcessingId("");
    }
  }

  const pendingCount = applications.filter(
    (application) => application.status === "pending"
  ).length;

  const approvedCount = applications.filter(
    (application) => application.status === "approved"
  ).length;

  return (
    <div className="min-h-screen bg-[#F3F6FB] text-[#06152B]">

      {/* MOBILE HEADER */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#06152B] text-white border-b border-white/10">
        <div className="h-16 px-4 flex items-center gap-3">

          <div className="relative w-14 h-10 rounded-xl overflow-hidden">
            <Image
              src="/bus.png"
              alt="GodSpeed"
              fill
              className="object-contain"
            />
          </div>

          <div>
            <p className="font-black text-sm">GODSPEED</p>
            <p className="text-[9px] text-[#4DA3FF] tracking-[0.2em]">
              MOBILITY ADMIN
            </p>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8">

        {/* TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#1976D2] uppercase">
              Network Management
            </p>

            <h1 className="text-2xl sm:text-3xl font-black mt-1">
              Operators
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Review and manage companies joining the GodSpeed Mobility network.
            </p>
          </div>

          <button
            onClick={loadApplications}
            className="self-start sm:self-auto px-5 h-11 rounded-xl bg-white border border-slate-200 text-sm font-bold hover:bg-slate-50 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-semibold">
              Total Applications
            </p>

            <p className="text-2xl font-black mt-1">
              {applications.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-semibold">
              Pending Review
            </p>

            <p className="text-2xl font-black text-[#1976D2] mt-1">
              {pendingCount}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-semibold">
              Approved Operators
            </p>

            <p className="text-2xl font-black text-emerald-600 mt-1">
              {approvedCount}
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* MOBILE CARDS */}
        <div className="lg:hidden space-y-4">

          {loading ? (
            <LoadingCard />
          ) : applications.length === 0 ? (
            <EmptyState />
          ) : (
            applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">

                  <div>
                    <h2 className="font-black text-lg">
                      {application.companyName}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      {application.contactName}
                    </p>
                  </div>

                  <StatusBadge status={application.status} />
                </div>

                <div className="mt-5 space-y-3 text-sm">

                  <Info label="Phone" value={application.phone} />

                  <Info label="Email" value={application.email} />

                  <Info
                    label="Location"
                    value={application.businessAddress}
                  />

                  <Info
                    label="Vehicles"
                    value={String(application.vehicleCount)}
                  />

                  <Info
                    label="Registration"
                    value={application.businessRegistrationNumber}
                  />

                  <Info
                    label="Operating areas"
                    value={application.operatingLocations.join(", ")}
                  />
                </div>

                {application.status === "pending" && (
                  <div className="grid grid-cols-2 gap-3 mt-5">

                    <button
                      disabled={processingId === application.id}
                      onClick={() => rejectOperator(application)}
                      className="h-12 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      disabled={processingId === application.id}
                      onClick={() => approveOperator(application)}
                      className="h-12 rounded-xl bg-[#1976D2] text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {processingId === application.id
                        ? "Processing..."
                        : "Approve"}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-sm">

              <thead className="bg-[#06152B] text-white">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">
                    Operator
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Contact
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Location
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Vehicles
                  </th>

                  <th className="text-left px-5 py-4 font-semibold">
                    Status
                  </th>

                  <th className="text-right px-5 py-4 font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      Loading operator applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-slate-400"
                    >
                      No operator applications yet.
                    </td>
                  </tr>
                ) : (
                  applications.map((application) => (
                    <tr
                      key={application.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-5 py-5">
                        <p className="font-bold">
                          {application.companyName}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {application.businessRegistrationNumber}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p>{application.contactName}</p>

                        <p className="text-xs text-slate-400 mt-1">
                          {application.phone}
                        </p>

                        <p className="text-xs text-slate-400">
                          {application.email}
                        </p>
                      </td>

                      <td className="px-5 py-5">
                        <p>{application.businessAddress}</p>

                        <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                          {application.operatingLocations.join(", ")}
                        </p>
                      </td>

                      <td className="px-5 py-5 font-bold">
                        {application.vehicleCount}
                      </td>

                      <td className="px-5 py-5">
                        <StatusBadge status={application.status} />
                      </td>

                      <td className="px-5 py-5">
                        {application.status === "pending" ? (
                          <div className="flex justify-end gap-2">

                            <button
                              disabled={processingId === application.id}
                              onClick={() => rejectOperator(application)}
                              className="px-4 h-10 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 disabled:opacity-50"
                            >
                              Reject
                            </button>

                            <button
                              disabled={processingId === application.id}
                              onClick={() => approveOperator(application)}
                              className="px-4 h-10 rounded-xl bg-[#1976D2] text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                            >
                              {processingId === application.id
                                ? "..."
                                : "Approve"}
                            </button>

                          </div>
                        ) : (
                          <p className="text-right text-xs text-slate-400">
                            No action
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>

        <footer className="text-center py-8">
          <p className="text-[10px] text-slate-400 tracking-[0.2em]">
            GODSPEED TECHNOLOGIES • MOBILITY NETWORK
          </p>
        </footer>
      </main>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: OperatorApplication["status"];
}) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium max-w-[65%] break-words">
        {value}
      </span>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
      <p className="text-sm text-slate-400">
        Loading operator applications...
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
      <div className="relative mx-auto w-28 h-20 rounded-2xl overflow-hidden bg-[#F3F6FB]">
        <Image
          src="/bus.png"
          alt="GodSpeed Mobility"
          fill
          className="object-contain opacity-60"
        />
      </div>

      <h2 className="font-bold mt-5">
        No operator applications yet
      </h2>

      <p className="text-sm text-slate-400 mt-1">
        New operator applications will appear here.
      </p>
    </div>
  );
}

export default function AdminOperatorsPage() {
  return (
    <AdminGate>
      <OperatorsPage />
    </AdminGate>
  );
}
