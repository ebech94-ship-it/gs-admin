"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AdminGate from "@/components/AdminGate";
import { db } from "@/lib/firebase";

type StaffMember = {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  accountStatus?: string;
  operatorId?: string;
  createdAt?: { toDate?: () => Date } | Date | string;
};

const STAFF_ROLES = [
  "godspeed_admin",
  "godspeed_staff",
  "admin_staff",
  "support_staff",
  "finance_staff",
  "operations_staff",
];

function formatDate(value: StaffMember["createdAt"]) {
  if (!value) return "—";

  try {
    let date: Date;

    if (typeof value === "string") {
      date = new Date(value);
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value.toDate === "function") {
      date = value.toDate();
    } else {
      return "—";
    }

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString();
  } catch {
    return "—";
  }
}

function displayName(member: StaffMember) {
  return (
    member.fullName ||
    member.name ||
    member.email ||
    member.phone ||
    member.id
  );
}

function StaffContent() {
  const [users, setUsers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState("");

  const loadStaff = useCallback(async (showLoading = true) => {
  if (showLoading) setLoading(true);
  setError("");

  try {
    const snapshot = await getDocs(collection(db, "users"));

    const staff = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as StaffMember[];

    setUsers(staff);
  } catch (err) {
    console.error("Staff loading failed:", err);
    setError(
      "Unable to load staff. Check your sign-in and Firestore permissions."
    );
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  void loadStaff(false);
}, [loadStaff]);

  const staffMembers = useMemo(
    () => users.filter((user) => STAFF_ROLES.includes(user.role || "")),
    [users]
  );

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();

    return staffMembers.filter((member) => {
      const matchesSearch = [
        member.fullName,
        member.name,
        member.email,
        member.phone,
        member.role,
        member.id,
        member.operatorId,
      ].some((value) =>
        String(value || "").toLowerCase().includes(term)
      );

      const matchesRole =
        roleFilter === "all" || member.role === roleFilter;

      const status = (member.accountStatus || "active").toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && status === "active") ||
        (statusFilter === "suspended" &&
          ["suspended", "disabled", "inactive"].includes(status));

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffMembers, search, roleFilter, statusFilter]);

  const activeCount = staffMembers.filter(
    (member) =>
      (member.accountStatus || "active").toLowerCase() === "active"
  ).length;

  const suspendedCount = staffMembers.filter((member) =>
    ["suspended", "disabled", "inactive"].includes(
      (member.accountStatus || "").toLowerCase()
    )
  ).length;

  async function changeRole(member: StaffMember, role: string) {
    if (role === member.role || updatingId) return;

    if (member.role === "godspeed_admin" && role !== "godspeed_admin") {
      setError(
        "GodSpeed Admin roles cannot be changed from this page."
      );
      setSuccess("");
      return;
    }

    const confirmed = window.confirm(
      `Change ${displayName(member)}'s role to ${role.replaceAll("_", " ")}?`
    );

    if (!confirmed) return;

    setUpdatingId(member.id);
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "users", member.id), {
        role,
        updatedAt: serverTimestamp(),
      });

      setUsers((current) =>
        current.map((user) =>
          user.id === member.id ? { ...user, role } : user
        )
      );

      setSuccess("Staff role updated successfully.");
    } catch (err) {
      console.error("Staff role update failed:", err);
      setError(
        "Could not update the staff role. Check Firestore permissions."
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function toggleStatus(member: StaffMember) {
    if (updatingId) return;

    const currentStatus = (
      member.accountStatus || "active"
    ).toLowerCase();

    const nextStatus =
      currentStatus === "active" ? "suspended" : "active";

    if (
      member.role === "godspeed_admin" &&
      nextStatus === "suspended"
    ) {
      setError(
        "GodSpeed Admin accounts cannot be suspended from this page."
      );
      setSuccess("");
      return;
    }

    const confirmed = window.confirm(
      `${nextStatus === "suspended" ? "Suspend" : "Reactivate"} ${displayName(member)}?`
    );

    if (!confirmed) return;

    setUpdatingId(member.id);
    setError("");
    setSuccess("");

    try {
      await updateDoc(doc(db, "users", member.id), {
        accountStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });

      setUsers((current) =>
        current.map((user) =>
          user.id === member.id
            ? { ...user, accountStatus: nextStatus }
            : user
        )
      );

      setSuccess(
        nextStatus === "suspended"
          ? "Staff account suspended."
          : "Staff account reactivated."
      );
    } catch (err) {
      console.error("Staff status update failed:", err);
      setError(
        "Could not update account status. Check Firestore permissions."
      );
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              ← Back to dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Staff Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage GodSpeed administration and operational staff.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadStaff()}
            disabled={loading || Boolean(updatingId)}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh staff"}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total staff</p>
            <p className="mt-2 text-3xl font-bold">
              {staffMembers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active staff</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Suspended / inactive</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {suspendedCount}
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone or ID..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All staff roles</option>
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All account statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended / inactive</option>
            </select>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Staff directory</h2>
            <span className="text-sm text-slate-500">
              {filteredStaff.length} result(s)
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading staff records...
            </div>
          ) : error && users.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Staff records could not be loaded.
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-semibold text-slate-700">
                No staff members found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-4 font-semibold">Staff member</th>
                    <th className="px-3 py-4 font-semibold">Contact</th>
                    <th className="px-3 py-4 font-semibold">Role</th>
                    <th className="px-3 py-4 font-semibold">Status</th>
                    <th className="px-3 py-4 font-semibold">Joined</th>
                    <th className="px-3 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((member) => {
                    const status = (
                      member.accountStatus || "active"
                    ).toLowerCase();

                    const isActive = status === "active";
                    const isUpdating = updatingId === member.id;

                    return (
                      <tr
                        key={member.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold text-slate-900">
                            {displayName(member)}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            ID: {member.id}
                          </p>
                          {member.operatorId && (
                            <p className="mt-1 text-xs text-slate-500">
                              Operator: {member.operatorId}
                            </p>
                          )}
                        </td>

                        <td className="px-3 py-4 text-slate-600">
                          <p>{member.email || "—"}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {member.phone || "No phone"}
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          <select
                            value={member.role || ""}
                            disabled={
                              isUpdating ||
                              Boolean(updatingId) ||
                              member.role === "godspeed_admin"
                            }
                            onChange={(event) =>
                              void changeRole(member, event.target.value)
                            }
                            className="max-w-48 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs capitalize outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                            aria-label={`Role for ${displayName(member)}`}
                          >
                            {STAFF_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {status.replaceAll("_", " ")}
                          </span>
                        </td>

                        <td className="px-3 py-4 text-slate-500">
                          {formatDate(member.createdAt)}
                        </td>

                        <td className="px-3 py-4">
                          <button
                            type="button"
                            disabled={
                              isUpdating ||
                              Boolean(updatingId) ||
                              member.role === "godspeed_admin"
                            }
                            onClick={() => void toggleStatus(member)}
                            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              isActive
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {isUpdating
                              ? "Updating..."
                              : isActive
                                ? "Suspend"
                                : "Reactivate"}
                          </button>
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
          Staff accounts are identified by their role in the users
          collection. Role changes and status updates require appropriate
          Firestore permissions. Protect privileged role assignments with
          server-side authorization and Firestore Security Rules.
        </p>
      </div>
    </div>
  );
}

export default function StaffPage() {
  return (
    <AdminGate>
      <StaffContent />
    </AdminGate>
  );
}
