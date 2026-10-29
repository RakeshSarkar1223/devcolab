"use client";

import React, { useState, useEffect } from "react";
import { authApi, userApi, projectApi } from "@/lib/api";

interface ServiceStatus {
  name: string;
  endpoint: string;
  port: number;
  expectedRoute: string;
  status: "idle" | "checking" | "online" | "offline";
  response?: string;
  error?: string;
  duration?: number;
}

export default function ServiceHealth() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "Auth Service",
      endpoint: "/api/auth/hello",
      port: 8081,
      expectedRoute: "lb://AUTH-SERVICE (Port 8081)",
      status: "idle",
    },
    {
      name: "User Service",
      endpoint: "/api/user/hello",
      port: 8082,
      expectedRoute: "lb://USER-SERVICE (Port 8082)",
      status: "idle",
    },
    {
      name: "Project Service",
      endpoint: "/api/projects/hello",
      port: 8083,
      expectedRoute: "lb://PROJECT-SERVICE (Port 8083)",
      status: "idle",
    },
  ]);

  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkService = async (index: number) => {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status: "checking" } : s))
    );

    const start = performance.now();
    try {
      let res = "";
      if (index === 0) res = await authApi.hello();
      if (index === 1) res = await userApi.hello();
      if (index === 2) res = await projectApi.hello();

      const duration = Math.round(performance.now() - start);
      setServices((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, status: "online", response: res, error: undefined, duration }
            : s
        )
      );
    } catch (err: unknown) {
      const duration = Math.round(performance.now() - start);
      const errMsg = err instanceof Error ? err.message : "Service unreachable";
      setServices((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, status: "offline", error: errMsg, response: undefined, duration }
            : s
        )
      );
    }
  };

  const checkAll = async () => {
    await Promise.all([checkService(0), checkService(1), checkService(2)]);
    setLastChecked(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    checkAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Microservices Connectivity
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Testing routes via Spring Cloud Gateway (
            <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono">
              http://localhost:8080
            </code>
            )
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-[11px] text-zinc-400">
              Checked at {lastChecked}
            </span>
          )}
          <button
            onClick={checkAll}
            className="px-3.5 py-2 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm"
          >
            Check All Services
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((svc, i) => {
          const isOnline = svc.status === "online";
          const isOffline = svc.status === "offline";
          const isChecking = svc.status === "checking";

          return (
            <div
              key={svc.name}
              className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                isOnline
                  ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-800/60 dark:bg-emerald-950/20"
                  : isOffline
                  ? "border-rose-300 bg-rose-50/20 dark:border-rose-800/60 dark:bg-rose-950/20"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {svc.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {svc.expectedRoute}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                      isOnline
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                        : isOffline
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOnline
                          ? "bg-emerald-500"
                          : isOffline
                          ? "bg-rose-500"
                          : "bg-zinc-400 animate-ping"
                      }`}
                    />
                    {isChecking
                      ? "Checking..."
                      : isOnline
                      ? "Online"
                      : isOffline
                      ? "Offline"
                      : "Idle"}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs space-y-1.5">
                  <div className="flex justify-between text-zinc-500 text-[11px]">
                    <span>Endpoint</span>
                    <code className="text-zinc-700 dark:text-zinc-300 font-mono">
                      {svc.endpoint}
                    </code>
                  </div>

                  {svc.duration !== undefined && (
                    <div className="flex justify-between text-zinc-500 text-[11px]">
                      <span>Latency</span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {svc.duration} ms
                      </span>
                    </div>
                  )}

                  {svc.response && (
                    <div className="mt-2 p-2 rounded bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-mono text-[11px]">
                      &quot;{svc.response}&quot;
                    </div>
                  )}

                  {svc.error && (
                    <div className="mt-2 p-2 rounded bg-rose-100/60 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-mono text-[11px] leading-relaxed break-words">
                      {svc.error}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => checkService(i)}
                disabled={isChecking}
                className="mt-4 w-full py-1.5 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                {isChecking ? "Testing..." : "Test Endpoint"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Startup & Troubleshooting Guide */}
      <div className="p-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-xs">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2 text-sm">
          Backend Microservices Startup Guide
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
          If any service shows <code>Internal Server Error</code> or <code>Offline</code>, make sure each Spring Boot service is launched in the following order:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">1. Eureka Server</span>
            <code className="text-[11px] text-zinc-500 block mt-1">Port 8761</code>
            <p className="text-[11px] text-zinc-500 mt-1">Start first so other services can register.</p>
          </div>
          <div className="p-3 rounded border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">2. Auth Service</span>
            <code className="text-[11px] text-zinc-500 block mt-1">Port 8081</code>
            <p className="text-[11px] text-zinc-500 mt-1">Registers <code>AUTH-SERVICE</code> to Eureka.</p>
          </div>
          <div className="p-3 rounded border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">3. User & Projects</span>
            <code className="text-[11px] text-zinc-500 block mt-1">Ports 8082, 8083</code>
            <p className="text-[11px] text-zinc-500 mt-1">Register <code>USER-SERVICE</code> and <code>PROJECT-SERVICE</code>.</p>
          </div>
          <div className="p-3 rounded border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">4. API Gateway</span>
            <code className="text-[11px] text-zinc-500 block mt-1">Port 8080</code>
            <p className="text-[11px] text-zinc-500 mt-1">Routes traffic to the active instances.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
