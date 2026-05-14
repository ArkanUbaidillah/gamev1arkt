"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (mode === "signup") {
      const { error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpErr) {
        setError(signUpErr.message);
        setLoading(false);
        return;
      }

      setSuccess("Cek email kamu untuk konfirmasi!");
    } else {
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginErr) {
        setError(loginErr.message);
        setLoading(false);
        return;
      }

      router.push("/");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-1 font-black text-cyan-400 tracking-widest">
            ARKTARENA
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Login atau buat akun
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setMode(item);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  mode === item
                    ? "bg-cyan-500 text-gray-950"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3
                  text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500
                  focus:ring-1 focus:ring-cyan-500 transition text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3
                  text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500
                  focus:ring-1 focus:ring-cyan-500 transition text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-900/40 border border-green-700 text-green-400 text-sm px-3 py-2 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700
                text-gray-950 font-bold py-3 rounded-lg transition-all text-sm
                tracking-wider uppercase shadow-lg shadow-cyan-500/20"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Masuk ke Arena"
                  : "Daftar dengan Email"}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
