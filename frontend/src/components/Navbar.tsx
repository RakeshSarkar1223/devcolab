"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { currentUser, isAuthenticated, logout } = useAuth();

  const tabs = [
    { id: "health", label: "Health & Services" },
    { id: "auth", label: "Auth (JWT)" },
    { id: "users", label: "User Profiles" },
    { id: "projects", label: "Projects & Teams" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs tracking-wider">
            DC
          </div>
          <div>
            <h1 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base leading-tight">
              DevColab
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Microservices Dashboard
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Session Pill */}
        <div className="flex items-center gap-2 text-xs">
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[140px] font-mono">{currentUser.email}</span>
                <span className="text-[10px] opacity-70">#{currentUser.id}</span>
              </span>
              <button
                onClick={logout}
                className="px-2 py-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                title="Log out"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="text-zinc-500 dark:text-zinc-400 text-xs flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-[11px]">Not logged in</span>
              <button
                onClick={() => setActiveTab("auth")}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Sign In →
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
