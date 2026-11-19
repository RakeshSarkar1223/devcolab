"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/context/UserProfileContext";
import ProfilePercentWheel from "@/components/ProfilePercentWheel";

interface ProfileSectionTopRightProps {
  onNavigateToTab?: (tab: string) => void;
}

export default function ProfileSectionTopRight({
  onNavigateToTab,
}: ProfileSectionTopRightProps) {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { profile, stats, openEditModal } = useUserProfile();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayName =
    profile?.name?.trim() ||
    (currentUser ? currentUser.email.split("@")[0] : "Guest");

  // Missing fields for quick prompt
  const missingFields = stats.fields.filter((f) => !f.isFilled);
  const nextFieldToFill = missingFields.length > 0 ? missingFields[0].label : null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ========================================== */}
      {/* Top Right Navbar Trigger Pill             */}
      {/* ========================================== */}
      {isAuthenticated && currentUser ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="group flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          title={`Profile completion: ${stats.percentage}%`}
        >
          {/* Animated Circular Percentage Wheel around Avatar */}
          <ProfilePercentWheel
            percentage={stats.percentage}
            size={32}
            strokeWidth={3}
            variant="avatar-ring"
            avatarUrl={profile?.avatar_link}
            name={displayName}
            email={currentUser.email}
          />

          {/* User Name & Completion Percent Tag */}
          <div className="flex flex-col text-left max-w-[110px] sm:max-w-[130px]">
            <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1">
              <span
                className={`font-bold ${
                  stats.percentage === 100
                    ? "text-emerald-600 dark:text-emerald-400"
                    : stats.percentage >= 75
                    ? "text-indigo-600 dark:text-indigo-400"
                    : stats.percentage >= 50
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {stats.percentage}%
              </span>
              <span>filled</span>
            </span>
          </div>

          {/* Dropdown Chevron */}
          <svg
            className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      ) : (
        /* Guest Trigger Button */
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/70 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <ProfilePercentWheel
            percentage={0}
            size={30}
            strokeWidth={2.5}
            variant="avatar-ring"
            name="Guest"
          />
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Profile (0%)
          </span>
          <svg
            className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {/* ========================================== */}
      {/* Dropdown Popover Card                     */}
      {/* ========================================== */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-hidden animate-fade-in text-xs">
          {isAuthenticated && currentUser ? (
            <div>
              {/* Profile Card Header */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProfilePercentWheel
                      percentage={stats.percentage}
                      size={44}
                      strokeWidth={3.5}
                      variant="avatar-ring"
                      avatarUrl={profile?.avatar_link}
                      name={displayName}
                      email={currentUser.email}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {displayName}
                        </span>
                        {currentUser.verified && (
                          <span
                            title="Verified Account"
                            className="text-emerald-500 shrink-0"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 font-mono truncate">
                        {currentUser.email}
                      </p>
                      <span className="inline-block px-1.5 py-0.2 mt-0.5 rounded text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                        User #{currentUser.id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      openEditModal();
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Profile Completion Feature Banner with Percent Wheel */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-br from-zinc-50/50 to-white dark:from-zinc-900 dark:to-zinc-800/40">
                <div className="flex items-center gap-4">
                  {/* Gauge Percent Wheel */}
                  <ProfilePercentWheel
                    percentage={stats.percentage}
                    size={68}
                    strokeWidth={5}
                    variant="gauge"
                  />

                  {/* Summary & Encouragement */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Profile Strength
                      </span>
                      <span
                        className={`font-semibold font-mono text-xs ${
                          stats.percentage === 100
                            ? "text-emerald-600 dark:text-emerald-400"
                            : stats.percentage >= 75
                            ? "text-indigo-600 dark:text-indigo-400"
                            : stats.percentage >= 50
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {stats.levelTitle}
                      </span>
                    </div>

                    {/* Linear Progress Bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 my-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          stats.percentage === 100
                            ? "bg-emerald-500"
                            : stats.percentage >= 75
                            ? "bg-indigo-500"
                            : stats.percentage >= 50
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {stats.filledCount} of {stats.totalCount} attributes completed.
                      {nextFieldToFill && (
                        <span className="block text-zinc-700 dark:text-zinc-300 font-medium mt-0.5">
                          Tip: Add your <u>{nextFieldToFill}</u> to reach{" "}
                          {Math.round(((stats.filledCount + 1) / stats.totalCount) * 100)}%!
                        </span>
                      )}
                      {stats.percentage === 100 && (
                        <span className="block text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          🌟 Great job! Your profile is 100% complete!
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Fields Checklist */}
              <div className="p-3 max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                <div className="pb-1.5 px-1 flex items-center justify-between text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                  <span>Profile Information</span>
                  <span>Status</span>
                </div>

                {stats.fields.map((field) => (
                  <div
                    key={field.key}
                    onClick={() => {
                      setIsOpen(false);
                      openEditModal();
                    }}
                    className="py-1.5 px-1 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded transition-colors cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white">
                        {field.label}
                      </span>
                      {field.isFilled ? (
                        <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                          {field.value}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 italic">
                          Not provided yet
                        </p>
                      )}
                    </div>

                    {field.isFilled ? (
                      <span className="h-4 w-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg
                          className="w-2.5 h-2.5 stroke-[2.5]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400 flex items-center justify-center shrink-0 text-[10px]">
                        +
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openEditModal();
                  }}
                  className="flex-1 py-1.5 px-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md font-medium text-center transition-colors cursor-pointer shadow-xs"
                >
                  {stats.percentage < 100 ? "Complete Profile →" : "Edit Profile"}
                </button>

                {onNavigateToTab && (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateToTab("users");
                    }}
                    className="py-1.5 px-2.5 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                    title="View all user profiles in database"
                  >
                    Directory
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="py-1.5 px-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            /* Guest Dropdown */
            <div className="p-5 text-center">
              <div className="flex justify-center mb-3">
                <ProfilePercentWheel
                  percentage={0}
                  size={56}
                  strokeWidth={4}
                  variant="gauge"
                />
              </div>
              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                You are browsing as Guest
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
                Sign in to fill your developer profile, monitor completion with the
                percentage wheel, and collaborate on projects.
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToTab) onNavigateToTab("auth");
                }}
                className="w-full py-2 px-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-md font-medium transition-colors cursor-pointer"
              >
                Sign In / Register →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
