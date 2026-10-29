"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthResponse, CurrentUser, LoginRequest, RegisterRequest } from "@/types";
import { authApi, getStoredToken, getStoredUser, clearAuth, setStoredToken, setStoredUser } from "@/lib/api";

interface AuthContextType {
  currentUser: AuthResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<CurrentUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from localStorage on client mount
  useEffect(() => {
    try {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setCurrentUser(storedUser);
      }
    } catch (err) {
      console.error("Error reading stored authentication:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      if (response.token) {
        setToken(response.token);
        setCurrentUser(response);
        setStoredToken(response.token);
        setStoredUser(response);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      if (response.token) {
        setToken(response.token);
        setCurrentUser(response);
        setStoredToken(response.token);
        setStoredUser(response);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    setCurrentUser(null);
    setToken(null);
  };

  const refreshUser = async (): Promise<CurrentUser | null> => {
    if (!token) return null;
    try {
      const user = await authApi.getCurrentUser();
      if (currentUser && user) {
        const updated: AuthResponse = {
          ...currentUser,
          id: user.id,
          email: user.email,
          verified: user.verified,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
        setCurrentUser(updated);
        setStoredUser(updated);
      }
      return user;
    } catch (err) {
      console.error("Failed to refresh current user:", err);
      return null;
    }
  };

  const value: AuthContextType = {
    currentUser,
    token,
    isAuthenticated: !!currentUser && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
