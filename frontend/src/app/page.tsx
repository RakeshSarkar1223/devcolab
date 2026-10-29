"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import ServiceHealth from "@/components/ServiceHealth";
import AuthSection from "@/components/AuthSection";
import UsersSection from "@/components/UsersSection";
import ProjectsSection from "@/components/ProjectsSection";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("projects");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === "health" && <ServiceHealth />}
        {activeTab === "auth" && <AuthSection />}
        {activeTab === "users" && <UsersSection />}
        {activeTab === "projects" && (
          <ProjectsSection onNavigateToAuth={() => setActiveTab("auth")} />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>DevColab</strong> Next.js Frontend — Connected to Spring Cloud Gateway (
            <code className="font-mono text-zinc-700 dark:text-zinc-300">
              http://localhost:8080
            </code>
            )
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Auth (8081)</span>
            <span>•</span>
            <span>User (8082)</span>
            <span>•</span>
            <span>Project (8083)</span>
            <span>•</span>
            <span>Eureka (8761)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
