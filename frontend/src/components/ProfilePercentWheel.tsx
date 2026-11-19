"use client";

import React from "react";

export interface ProfilePercentWheelProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  variant?: "avatar-ring" | "gauge" | "mini";
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  showBadge?: boolean;
  className?: string;
}

export default function ProfilePercentWheel({
  percentage,
  size = 38,
  strokeWidth = 3,
  variant = "avatar-ring",
  avatarUrl,
  name,
  email,
  showBadge = false,
  className = "",
}: ProfilePercentWheelProps) {
  // Clamp percentage between 0 and 100
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)));

  // SVG circular math
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Color scheme based on completion tier
  const getColorClasses = (pct: number) => {
    if (pct === 100) {
      return {
        stroke: "stroke-emerald-500 dark:stroke-emerald-400",
        track: "stroke-emerald-100 dark:stroke-emerald-950/60",
        text: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
        dot: "bg-emerald-500",
        glow: "shadow-emerald-500/20",
      };
    }
    if (pct >= 75) {
      return {
        stroke: "stroke-indigo-500 dark:stroke-indigo-400",
        track: "stroke-indigo-100 dark:stroke-indigo-950/60",
        text: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
        dot: "bg-indigo-500",
        glow: "shadow-indigo-500/20",
      };
    }
    if (pct >= 50) {
      return {
        stroke: "stroke-sky-500 dark:stroke-sky-400",
        track: "stroke-sky-100 dark:stroke-sky-950/60",
        text: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
        dot: "bg-sky-500",
        glow: "shadow-sky-500/20",
      };
    }
    if (pct >= 25) {
      return {
        stroke: "stroke-amber-500 dark:stroke-amber-400",
        track: "stroke-amber-100 dark:stroke-amber-950/60",
        text: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
        dot: "bg-amber-500",
        glow: "shadow-amber-500/20",
      };
    }
    return {
      stroke: "stroke-rose-500 dark:stroke-rose-400",
      track: "stroke-rose-100 dark:stroke-rose-950/60",
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
      dot: "bg-rose-500",
      glow: "shadow-rose-500/20",
    };
  };

  const colors = getColorClasses(clamped);

  // Generate fallback initials
  const getInitials = () => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.trim().slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.trim().slice(0, 2).toUpperCase();
    }
    return "DC";
  };

  // Avatar diameter inside the wheel ring
  const innerSize = Math.max(16, size - strokeWidth * 2 - 4);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 select-none"
        style={{ width: size, height: size }}
      >
        {/* SVG Progress Circle */}
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0 -rotate-90 pointer-events-none"
        >
          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={`${colors.track} transition-colors duration-300`}
          />
          {/* Animated Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${colors.stroke} transition-all duration-700 ease-out`}
          />
        </svg>

        {/* Content Inside the Wheel */}
        {variant === "avatar-ring" && (
          <div
            className="rounded-full overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold shadow-inner"
            style={{ width: innerSize, height: innerSize }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name || "Avatar"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image URL fails to load
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <span
                className="leading-none text-center font-mono font-bold"
                style={{ fontSize: Math.max(9, Math.round(innerSize * 0.42)) }}
              >
                {getInitials()}
              </span>
            )}
          </div>
        )}

        {variant === "gauge" && (
          <div className="flex flex-col items-center justify-center text-center">
            <span
              className={`font-bold font-mono leading-none tracking-tight ${colors.text}`}
              style={{ fontSize: Math.max(12, Math.round(size * 0.28)) }}
            >
              {clamped}%
            </span>
            {size >= 64 && (
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase mt-0.5">
                Filled
              </span>
            )}
          </div>
        )}

        {variant === "mini" && (
          <span
            className={`font-mono font-bold text-center leading-none ${colors.text}`}
            style={{ fontSize: Math.max(8, Math.round(size * 0.35)) }}
          >
            {clamped}%
          </span>
        )}
      </div>

      {/* Optional Badge label beside the wheel */}
      {showBadge && (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${colors.bg}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
          <span>{clamped}%</span>
        </span>
      )}
    </div>
  );
}
