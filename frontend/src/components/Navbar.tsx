"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import NotificationDropdown from "@/components/NotificationDropdown";
import ProfileSectionTopRight from "@/components/ProfileSectionTopRight";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const tabs = [
    { id: "projects", label: "Projects & Teams" },
    ...(isAuthenticated
      ? [
          {
            id: "notifications",
            label: "Notifications",
            badge: unreadCount > 0 ? unreadCount : null,
          },
        ]
      : []),
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
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-rose-500 text-white"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Notifications & Profile with Percent Wheel */}
        <div className="flex items-center gap-2.5 text-xs">
          {isAuthenticated && (
            <NotificationDropdown
              onNavigateToNotifications={() => setActiveTab("notifications")}
            />
          )}

          {/* Profile Section with Circular Percent Wheel */}
          <ProfileSectionTopRight onNavigateToTab={setActiveTab} />
        </div>
      </div>
    </header>
  );
}
