"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CurrentUser } from "@/types";

export default function AuthSection() {
  const { currentUser, isAuthenticated, token, login, register, logout, refreshUser } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // For /api/auth/me testing
  const [meLoading, setMeLoading] = useState(false);
  const [meData, setMeData] = useState<CurrentUser | null>(null);
  const [meError, setMeError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await register({ email, password });
        setSuccess(`Registration successful! User ID: ${res.id}`);
      } else {
        const res = await login({ email, password });
        setSuccess(`Login successful! Welcome back, ${res.email}`);
      }
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchMe = async () => {
    setMeLoading(true);
    setMeError(null);
    try {
      const data = await refreshUser();
      setMeData(data);
    } catch (err: unknown) {
      setMeError(err instanceof Error ? err.message : "Failed to fetch user");
    } finally {
      setMeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="p-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Authentication Service
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Issue JWT tokens and authenticate through{" "}
          <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
            /api/auth/register
          </code>
          ,{" "}
          <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
            /api/auth/login
          </code>
          , and{" "}
          <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
            /api/auth/me
          </code>
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="p-6 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  mode === "login"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSuccess(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  mode === "register"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Register
              </button>
            </div>
            <span className="text-xs text-zinc-400">
              {mode === "login" ? "POST /api/auth/login" : "POST /api/auth/register"}
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Password {mode === "register" && "(min 6 characters)"}
              </label>
              <input
                type="password"
                required
                minLength={mode === "register" ? 6 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 font-medium transition-colors disabled:opacity-60"
            >
              {loading
                ? "Processing..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>
        </div>

        {/* Current Session / Token Details */}
        <div className="p-6 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              Active Session Status
            </h3>
            {isAuthenticated && (
              <button
                onClick={logout}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
              >
                Clear Token
              </button>
            )}
          </div>

          {isAuthenticated && currentUser ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div>
                  <span className="text-zinc-400 block text-[11px]">User ID</span>
                  <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                    {currentUser.id}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[11px]">Verified</span>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      currentUser.verified
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {currentUser.verified ? "YES" : "NO"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-400 block text-[11px]">Email</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200 break-all">
                    {currentUser.email}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block text-[11px] mb-1">
                  Stored Bearer Token
                </span>
                <div className="p-2.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono break-all text-zinc-700 dark:text-zinc-300 max-h-24 overflow-y-auto">
                  {token}
                </div>
              </div>

              {/* /api/auth/me verification */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Test GET /api/auth/me
                  </span>
                  <button
                    onClick={handleFetchMe}
                    disabled={meLoading}
                    className="px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {meLoading ? "Fetching..." : "Call /me"}
                  </button>
                </div>

                {meError && (
                  <div className="p-2 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[11px]">
                    {meError}
                  </div>
                )}

                {meData && (
                  <pre className="p-2.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono overflow-x-auto text-zinc-700 dark:text-zinc-300">
                    {JSON.stringify(meData, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-400 text-xs">
              <p>No active token found in storage.</p>
              <p className="mt-1">
                Log in or register to authenticate and acquire a Bearer token.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
