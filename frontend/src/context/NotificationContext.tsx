"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Notification, NotificationRequest } from "@/types";
import { notificationApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  createNotification: (data: NotificationRequest) => Promise<Notification>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Fetch full notifications list & unread count
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [list, countRes] = await Promise.all([
        notificationApi.getAll(),
        notificationApi.getUnreadCount(),
      ]);

      const safeList = Array.isArray(list) ? list : [];
      setNotifications(safeList);
      setUnreadCount(typeof countRes?.count === "number" ? countRes.count : 0);
    } catch (err: unknown) {
      // Don't crash if notification service is briefly down
      const msg = err instanceof Error ? err.message : "Failed to load notifications";
      console.warn("Notification sync notice:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Periodic unread count check
  const pollUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const countRes = await notificationApi.getUnreadCount();
      if (typeof countRes?.count === "number") {
        setUnreadCount(countRes.count);
      }
    } catch {
      // Silently ignore background poll errors
    }
  }, [isAuthenticated]);

  // Initial load when user authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, currentUser?.id, refreshNotifications]);

  // Background polling every 20 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      pollUnreadCount();
    }, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pollUnreadCount]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await notificationApi.markAsRead(id);
    } catch (err: unknown) {
      // Revert / refresh on error
      const msg = err instanceof Error ? err.message : "Failed to mark as read";
      setError(msg);
      await refreshNotifications();
      throw err;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await notificationApi.markAllAsRead();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to mark all as read";
      setError(msg);
      await refreshNotifications();
      throw err;
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await notificationApi.delete(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete notification";
      setError(msg);
      await refreshNotifications();
      throw err;
    }
  };

  // Create notification
  const createNotification = async (data: NotificationRequest) => {
    try {
      const created = await notificationApi.create(data);
      // If notification was created for this user, prepend it
      if (currentUser && created.userId === currentUser.id) {
        setNotifications((prev) => [created, ...prev]);
        if (!created.read) {
          setUnreadCount((prev) => prev + 1);
        }
      }
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create notification";
      setError(msg);
      throw err;
    }
  };

  const value: NotificationContextType = {
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
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
