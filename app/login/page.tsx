
"use client";

import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      router.push("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06152B] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* GODSPEED BRAND AREA */}
        <div className="text-center mb-7">

          <div className="relative mx-auto w-40 h-24 mb-3">
            <div className="absolute inset-0 bg-[#1976D2]/20 blur-3xl rounded-full" />

            <Image
              src="/bus.png"
              alt="GodSpeed Mobility"
              fill
              priority
              className="object-contain relative drop-shadow-[0_10px_25px_rgba(25,118,210,0.35)]"
            />
          </div>

          <h1 className="text-3xl font-black tracking-[0.12em] text-white">
            GODSPEED
          </h1>

          <p className="text-[#4DA3FF] font-bold tracking-[0.35em] text-sm mt-1">
            MOBILITY
          </p>

          <p className="text-slate-400 text-sm mt-3">
            Administration Control Center
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="relative overflow-hidden bg-white rounded-[28px] border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">

          {/* BLUE TOP ACCENT */}
          <div className="h-1.5 bg-gradient-to-r from-[#0B1F3A] via-[#1976D2] to-[#4DA3FF]" />

          <div className="p-6 sm:p-8">

            <div className="mb-7">
              <p className="text-[#1976D2] text-xs font-bold tracking-[0.2em] uppercase">
                Secure Access
              </p>

              <h2 className="text-2xl font-bold text-[#06152B] mt-2">
                Welcome back
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Sign in to manage the GodSpeed Mobility network.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-[#0B1F3A] mb-2">
                  Email address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your admin email"
                  autoComplete="email"
                  className="w-full h-13 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-[#06152B] outline-none transition focus:border-[#1976D2] focus:ring-4 focus:ring-[#1976D2]/10"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-[#0B1F3A] mb-2">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-13 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-[#06152B] outline-none transition focus:border-[#1976D2] focus:ring-4 focus:ring-[#1976D2]/10"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-600">
                    {error}
                  </p>
                </div>
              )}

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 rounded-2xl bg-[#1976D2] hover:bg-[#1565C0] active:scale-[0.99] text-white font-bold transition shadow-lg shadow-[#1976D2]/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Enter Admin Center"}
              </button>
            </form>

            {/* SECURITY FOOTER */}
            <div className="mt-7 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Authorized GodSpeed administrators only
              </p>
            </div>
          </div>
        </div>

        {/* PAGE FOOTER */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            GODSPEED TECHNOLOGIES
          </p>

          <p className="text-[10px] text-slate-600 mt-1 tracking-wider">
            COMFORT • SAFETY • ON TIME
          </p>
        </div>

      </div>
    </main>
  );
}
