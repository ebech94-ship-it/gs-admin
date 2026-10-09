
"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import AdminGate from "@/components/AdminGate";
import { db } from "@/lib/firebase";

type PlatformSettings = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  platformFee: string;
  currency: string;
  maintenanceMode: boolean;
  allowNewOperators: boolean;
};

const defaults: PlatformSettings = {
  platformName: "GodSpeed Mobility",
  supportEmail: "",
  supportPhone: "",
  platformFee: "100",
  currency: "XAF",
  maintenanceMode: false,
  allowNewOperators: true,
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<PlatformSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const ref = doc(db, "platformSettings", "general");
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          setSettings({
            ...defaults,
            ...snapshot.data(),
            platformFee: String(
              snapshot.data().platformFee ?? defaults.platformFee
            ),
          } as PlatformSettings);
        }
      } catch (err) {
        console.error("Settings load failed:", err);
        setError("Could not load settings. Check admin permissions.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateSetting<K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const fee = Number(settings.platformFee);

      if (!Number.isFinite(fee) || fee < 0) {
        throw new Error("Enter a valid platform fee.");
      }

      await setDoc(
        doc(db, "platformSettings", "general"),
        {
          ...settings,
          platformFee: fee,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Settings saved successfully.");
    } catch (err) {
      console.error("Settings save failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not save settings. Check Firestore permissions."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGate>
      <main className="min-h-screen bg-[#F3F6FB] p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              GodSpeed Mobility
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#06152B]">
              Platform Settings
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage general platform information and operating preferences.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-slate-500 shadow-sm">
              Loading settings...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-[#06152B]">
                  General Information
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Platform Name">
                    <input
                      className={inputClass}
                      value={settings.platformName}
                      onChange={(e) =>
                        updateSetting("platformName", e.target.value)
                      }
                      placeholder="GodSpeed Mobility"
                    />
                  </Field>

                  <Field label="Support Email">
                    <input
                      className={inputClass}
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) =>
                        updateSetting("supportEmail", e.target.value)
                      }
                      placeholder="support@example.com"
                    />
                  </Field>

                  <Field label="Support Phone">
                    <input
                      className={inputClass}
                      value={settings.supportPhone}
                      onChange={(e) =>
                        updateSetting("supportPhone", e.target.value)
                      }
                      placeholder="+237..."
                    />
                  </Field>

                  <Field label="Currency">
                    <select
                      className={inputClass}
                      value={settings.currency}
                      onChange={(e) =>
                        updateSetting("currency", e.target.value)
                      }
                    >
                      <option value="XAF">XAF — Central African CFA franc</option>
                      <option value="NGN">NGN — Nigerian naira</option>
                    </select>
                  </Field>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-[#06152B]">
                  Platform Operations
                </h2>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Platform Fee (per passenger)">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={settings.platformFee}
                      onChange={(e) =>
                        updateSetting("platformFee", e.target.value)
                      }
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Amount in the selected currency. Saving this value alone
                      does not change passenger checkout calculations.
                    </p>
                  </Field>

                  <div className="space-y-4 pt-1">
                    <Toggle
                      label="Maintenance Mode"
                      description="Platform maintenance flag; enforcement must be connected separately."
                      checked={settings.maintenanceMode}
                      onChange={(value) =>
                        updateSetting("maintenanceMode", value)
                      }
                    />

                    <Toggle
                      label="Accept New Operators"
                      description="Controls this setting only until operator onboarding reads it."
                      checked={settings.allowNewOperators}
                      onChange={(value) =>
                        updateSetting("allowNewOperators", value)
                      }
                    />
                  </div>
                </div>
              </section>

              {message && (
                <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="rounded-xl bg-[#1976D2] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AdminGate>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4">
      <div>
        <p className="text-sm font-semibold text-[#06152B]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
