


"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

type AdminGateProps = {
  children: ReactNode;
};

export default function AdminGate({ children }: AdminGateProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("ADMIN AUTH USER:", user?.uid);

      if (!user) {
        console.log("ADMIN GATE: No authenticated user.");
        router.replace("/login");
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));

        console.log("ADMIN USER DOCUMENT EXISTS:", snapshot.exists());

        if (!snapshot.exists()) {
          setError(
            "Admin profile not found in Firestore for this authenticated account."
          );
          setChecking(false);
          return;
        }

        const data = snapshot.data();

        console.log("ADMIN USER DATA:", data);

        if (data.role !== "godspeed_admin") {
          setError(
            `Wrong admin role: ${data.role ?? "missing role"}`
          );
          setChecking(false);
          return;
        }

        if (data.accountStatus === "disabled") {
          setError("This Admin account is disabled.");
          setChecking(false);
          return;
        }

        setAllowed(true);
        setChecking(false);
      } catch (error) {
        console.error("ADMIN GATE FIREBASE ERROR:", error);

        setError(
          "Unable to verify Admin access. Check the browser console for the Firebase error."
        );

        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen bg-[#06152B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl border border-[#1976D2]/40 bg-[#0B1F3A] flex items-center justify-center animate-pulse">
            <span className="text-[#4DA3FF] font-black">GS</span>
          </div>

          <p className="text-white font-semibold mt-4">
            Securing Admin Center...
          </p>

          <p className="text-slate-500 text-xs mt-1">
            GodSpeed Mobility
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#06152B] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-2xl font-black">
            !
          </div>

          <h1 className="mt-5 text-xl font-black text-[#06152B]">
            Admin Access Check Failed
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-12 w-full rounded-2xl bg-[#1976D2] text-white font-bold"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
