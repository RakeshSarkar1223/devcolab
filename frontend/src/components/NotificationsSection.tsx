"use client";

import React, { useState, useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { notificationApi } from "@/lib/api";

interface NotificationsSectionProps {
  onNavigateToAuth?: () => void;
}

const TEMPLATES = [
  "🎉 Welcome to DevColab! Start collaborating on your first project.",
  "📁 You were assigned as a collaborator on Project Alpha.",
  "✅ Your pull request and project task were approved.",
  "🔔 Reminder: Project sprint review starts in 30 minutes.",
];

export default function NotificationsSection({
  onNavigateToAuth,
}: NotificationsSectionProps) {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    clearError,
  } = useNotifications();

  // Local state
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Action loading trackers
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Service health check
  const [serviceStatus, setServiceStatus] = useState<
    "idle" | "checking" | "online" | "offline"
  >("idle");
  const [serviceLatency, setServiceLatency] = useState<number | null>(null);

  // Prefill targetUserId when currentUser changes
  useEffect(() => {
    if (currentUser?.id) {
      setTargetUserId(currentUser.id.toString());
    }
  }, [currentUser]);

  // Ping notification service health
  const checkService = async () => {
    setServiceStatus("checking");
    const start = performance.now();
    try {
      await notificationApi.hello();
      const latency = Math.round(performance.now() - start);
      setServiceLatency(latency);
      setServiceStatus("online");
    } catch {
      setServiceLatency(null);
      setServiceStatus("offline");
    }
  };

  useEffect(() => {
    checkService();
  }, []);

  // Filter logic
  const filteredNotifications = notifications.filter((n) => {
    // Filter by read status
    if (filter === "unread" && n.read) return false;
    if (filter === "read" && !n.read) return false;

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchesMsg = n.message.toLowerCase().includes(q);
      const matchesId = n.id.toLowerCase().includes(q);
      return matchesMsg || matchesId;
    }

    return true;
  });

  const readCount = Math.max(0, notifications.length - unreadCount);

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const uid = parseInt(targetUserId.trim(), 10);
    if (isNaN(uid) || uid <= 0) {
      setFormError("Please enter a valid numeric User ID");
      return;
    }

    if (!message.trim()) {
      setFormError("Message content cannot be blank");
      return;
    }

    setCreating(true);
    try {
      const created = await createNotification({
        userId: uid,
        message: message.trim(),
      });
      setFormSuccess(
        `Notification sent successfully to User #${created.userId}!`
      );
      setMessage("");
      // Keep target user ID for quick additional messages
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create notification"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setProcessingId(id);
    clearError();
    try {
      await markAsRead(id);
      setActionSuccess("Notification marked as read");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      // error set in context
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    clearError();
    try {
      await markAllAsRead();
      setActionSuccess("All notifications marked as read");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      // error set in context
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    setProcessingId(id);
    clearError();
    try {
      await deleteNotification(id);
      setActionSuccess("Notification deleted");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch {
      // error set in context
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="p-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Notification Hub
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                serviceStatus === "online"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                  : serviceStatus === "offline"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  serviceStatus === "online"
                    ? "bg-emerald-500"
                    : serviceStatus === "offline"
                    ? "bg-rose-500"
                    : "bg-zinc-400"
                }`}
              />
              {serviceStatus === "online"
                ? `Online (${serviceLatency ?? 0}ms)`
                : serviceStatus === "offline"
                ? "Offline"
                : "Checking..."}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage user alerts, push messages, and microservice events routed
            via Spring Cloud Gateway (
            <code className="font-mono text-zinc-700 dark:text-zinc-300">
              /api/notifications/**
            </code>
            )
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshNotifications()}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {showCreateForm ? "Close Form" : "Send Notification"}
          </button>
        </div>
      </div>

      {/* Auth check warning banner */}
      {!isAuthenticated && (
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Authentication Required
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                Log in to view, receive, and manage your personal notifications.
              </p>
            </div>
          </div>
          {onNavigateToAuth && (
            <button
              onClick={onNavigateToAuth}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 cursor-pointer"
            >
              Go to Sign In →
            </button>
          )}
        </div>
      )}

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-emerald-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {actionSuccess}
          </span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-rose-600 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </span>
          <button
            onClick={() => clearError()}
            className="text-rose-600 hover:underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Total Alerts
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {notifications.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>

        {/* Unread */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Unread
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {unreadCount}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={markingAll}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium disabled:opacity-50"
                  title="Mark all as read"
                >
                  {markingAll ? "Marking..." : "Clear unread"}
                </button>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Read */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Read & Archived
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {readCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Microservice Port */}
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
              Service Route
            </p>
            <p className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100 mt-1.5">
              Port 8084
            </p>
            <p className="text-[10px] text-zinc-400 font-mono">
              NOTIFICATION-SERVICE
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Expandable "Send / Create Notification" Form */}
      {showCreateForm && (
        <div className="p-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all animate-in fade-in">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                Send / Dispatch Notification
              </h3>
              <p className="text-xs text-zinc-500">
                Dispatches an alert to a target user via backend endpoint{" "}
                <code className="text-zinc-700 dark:text-zinc-300 font-mono">
                  POST /api/notifications
                </code>
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ✕ Close
            </button>
          </div>

          {formSuccess && (
            <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
              {formSuccess}
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 rounded bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Recipient User ID *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400"
                  />
                  {currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => setTargetUserId(currentUser.id.toString())}
                      className="absolute right-2 top-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                      (My ID: #{currentUser.id})
                    </button>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Quick Message Templates
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessage(tmpl)}
                      className="text-[11px] px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-left truncate max-w-[200px]"
                      title={tmpl}
                    >
                      {tmpl.split(" ")[0]} {tmpl.substring(0, 24)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Notification Message *
                </label>
                <span className="text-[10px] text-zinc-400">
                  {message.length} characters
                </span>
              </div>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter alert or message text..."
                className="w-full px-3 py-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setMessage("");
                  setFormError(null);
                  setFormSuccess(null);
                }}
                className="px-3.5 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {creating ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Control Bar: Filters, Search, and Bulk Actions */}
      <div className="p-4 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === "unread"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filter === "read"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Read ({readCount})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mark All as Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              title="Mark all unread notifications as read"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {markingAll ? "Marking..." : "Mark All as Read"}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <p className="font-medium text-zinc-600 dark:text-zinc-300">
              Loading notifications from database...
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {searchQuery
                ? `No notifications matching "${searchQuery}"`
                : filter === "unread"
                ? "No unread notifications"
                : filter === "read"
                ? "No read notifications"
                : "No notifications yet"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? "Try clearing your search query to see other messages."
                : filter === "unread"
                ? "You're all caught up! Great job."
                : "Click 'Send Notification' above to create a test notification."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 px-3.5 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                + Create Notification
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredNotifications.map((n) => {
              const isItemProcessing = processingId === n.id;
              const formattedDate = new Date(n.createdAt).toLocaleString(
                undefined,
                {
                  dateStyle: "medium",
                  timeStyle: "short",
                }
              );

              return (
                <div
                  key={n.id}
                  className={`p-4 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                    !n.read
                      ? "bg-blue-50/30 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40 border-l-4 border-l-transparent"
                  }`}
                >
                  {/* Left content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="pt-0.5 shrink-0">
                      <span
                        className={`inline-flex items-center justify-center h-7 w-7 rounded-full ${
                          !n.read
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            !n.read
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {!n.read ? "NEW / UNREAD" : "READ"}
                        </span>

                        <span className="text-[10px] text-zinc-500 font-mono">
                          User #{n.userId}
                        </span>

                        <span className="text-[10px] text-zinc-400">
                          {formattedDate}
                        </span>
                      </div>

                      <p
                        className={`text-xs leading-relaxed break-words ${
                          !n.read
                            ? "font-medium text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {n.message}
                      </p>

                      <div className="mt-2 text-[10px] text-zinc-400 font-mono truncate max-w-sm">
                        ID: {n.id}
                      </div>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        disabled={isItemProcessing}
                        className="px-2.5 py-1 text-xs font-medium rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Mark notification as read"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Mark Read
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(n.id)}
                      disabled={isItemProcessing}
                      className="px-2.5 py-1 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Delete notification"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
