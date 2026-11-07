"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, HardHat, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login gagal");
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-700">
          <HardHat className="h-9 w-9 text-white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            RitasiCounter
          </h1>
          <p className="text-sm text-gray-500">Sistem Pencatatan Ritasi Hauler</p>
        </div>
      </div>

      {/* Card */}
      <div className="card w-full max-w-sm p-6">
        <h2 className="font-heading text-lg font-semibold text-gray-900 mb-6">
          Masuk ke Akun
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              className="input"
              placeholder="Masukkan username"
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password / PIN
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                className="input pr-12"
                placeholder="Masukkan password atau PIN"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-base py-3.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Masuk"
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-400">
        © 2024 RitasiCounter · Tambang Nusantara
      </p>
    </div>
  );
}
