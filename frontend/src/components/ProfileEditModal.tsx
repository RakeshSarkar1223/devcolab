"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUserProfile } from "@/context/UserProfileContext";
import { UserRequest } from "@/types";
import ProfilePercentWheel from "@/components/ProfilePercentWheel";

const SUGGESTED_SKILLS = [
  "Java",
  "Spring Boot",
  "React",
  "Next.js",
  "TypeScript",
  "Kafka",
  "Docker",
  "PostgreSQL",
  "TailwindCSS",
  "Microservices",
  "GraphQL",
  "Kubernetes",
];

const AVATAR_PRESETS = [
  { label: "Tech Bot", url: "https://api.dicebear.com/7.x/bottts/svg?seed=devcolab" },
  { label: "Developer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=coder" },
  { label: "Geek", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=hacker" },
  { label: "Abstract", url: "https://avatar.vercel.sh/devcolab" },
];

export default function ProfileEditModal() {
  const {
    profile,
    isEditModalOpen,
    closeEditModal,
    updateProfile,
    calculateStatsForData,
  } = useUserProfile();

  const [formData, setFormData] = useState<UserRequest>({
    name: "",
    email: "",
    bio: "",
    skills: "",
    college: "",
    department: "",
    social_links: "",
    avatar_link: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when modal opens or profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        skills: profile.skills || "",
        college: profile.college || "",
        department: profile.department || "",
        social_links: profile.social_links || "",
        avatar_link: profile.avatar_link || "",
      });
    }
    setSaveSuccess(false);
    setErrorMessage(null);
  }, [profile, isEditModalOpen]);

  // Compute live real-time stats based on current form inputs!
  const liveStats = useMemo(() => {
    return calculateStatsForData(formData);
  }, [formData, calculateStatsForData]);

  if (!isEditModalOpen) return null;

  const handleInputChange = (field: keyof UserRequest, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setSaveSuccess(false);
  };

  const handleAddSkill = (skill: string) => {
    const existing = formData.skills
      ? formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (!existing.includes(skill)) {
      const updated = [...existing, skill].join(", ");
      handleInputChange("skills", updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => {
        closeEditModal();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save profile changes"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0 -z-10"
        onClick={closeEditModal}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ProfilePercentWheel
              percentage={liveStats.percentage}
              size={48}
              strokeWidth={4}
              variant="avatar-ring"
              avatarUrl={formData.avatar_link}
              name={formData.name}
              email={formData.email}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="profile-modal-title"
                  className="font-bold text-base text-zinc-900 dark:text-zinc-100"
                >
                  Edit Your Profile
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                    liveStats.percentage === 100
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : liveStats.percentage >= 75
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      : liveStats.percentage >= 50
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  }`}
                >
                  {liveStats.percentage}% Complete
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {liveStats.filledCount} of {liveStats.totalCount} fields completed &bull;{" "}
                {liveStats.levelTitle}
              </p>
            </div>
          </div>

          <button
            onClick={closeEditModal}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Live Progress Bar Indicator */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              liveStats.percentage === 100
                ? "bg-emerald-500"
                : liveStats.percentage >= 75
                ? "bg-indigo-500"
                : liveStats.percentage >= 50
                ? "bg-blue-500"
                : liveStats.percentage >= 25
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${liveStats.percentage}%` }}
          />
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold ml-2"
              >
                &times;
              </button>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Profile updated successfully! Wheel percentage recalculated.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                {formData.name.trim() ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    ✓ Filled (+12.5%)
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    Required
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            {/* 2. Email (Read-only or synced) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                  ✓ Verified (+12.5%)
                </span>
              </div>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60 text-zinc-500 cursor-not-allowed font-mono"
              />
            </div>

            {/* 3. Bio */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  Bio / Summary
                </label>
                <span
                  className={`text-[10px] ${
                    formData.bio?.trim()
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {formData.bio?.trim() ? "✓ Filled (+12.5%)" : "0 / 80+ chars"}
                </span>
              </div>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Share a short bio about what you're building, your focus, or your engineering passion..."
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            {/* 4. Skills */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  Skills & Technologies (comma separated)
                </label>
                <span
                  className={`text-[10px] ${
                    formData.skills?.trim()
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {formData.skills?.trim() ? "✓ Filled (+12.5%)" : "Add skills"}
                </span>
              </div>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="e.g. React, Spring Boot, Java, Docker, Next.js"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              {/* Quick skill suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-zinc-400">Quick add:</span>
                {SUGGESTED_SKILLS.map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => handleAddSkill(sk)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    +{sk}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. College */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  College / University
                </label>
                <span
                  className={`text-[10px] ${
                    formData.college?.trim()
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {formData.college?.trim() ? "✓ Filled (+12.5%)" : "Optional"}
                </span>
              </div>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => handleInputChange("college", e.target.value)}
                placeholder="e.g. MIT, Stanford, IIT, etc."
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            {/* 6. Department */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  Department / Branch
                </label>
                <span
                  className={`text-[10px] ${
                    formData.department?.trim()
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {formData.department?.trim() ? "✓ Filled (+12.5%)" : "Optional"}
                </span>
              </div>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
                placeholder="e.g. Computer Science, Information Technology"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            {/* 7. Social Links */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  Social / Portfolio Links
                </label>
                <span
                  className={`text-[10px] ${
                    formData.social_links?.trim()
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {formData.social_links?.trim() ? "✓ Filled (+12.5%)" : "Optional"}
                </span>
              </div>
              <input
                type="text"
                value={formData.social_links}
                onChange={(e) => handleInputChange("social_links", e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            {/* 8. Avatar Image Link */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">
                  Avatar Image Link
                </label>
                <span
                  className={`text-[10px] ${
                    formData.avatar_link?.trim()
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {formData.avatar_link?.trim() ? "✓ Filled (+12.5%)" : "Optional"}
                </span>
              </div>
              <input
                type="url"
                value={formData.avatar_link}
                onChange={(e) => handleInputChange("avatar_link", e.target.value)}
                placeholder="https://avatar.vercel.sh/yourname"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-zinc-400">Presets:</span>
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleInputChange("avatar_link", p.url)}
                    className="px-2 py-0.5 rounded text-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500">
                {liveStats.missingCount === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    🎉 Outstanding! All 8 profile attributes filled!
                  </span>
                ) : (
                  <span>
                    Fill <strong>{liveStats.missingCount} more</strong> to hit 100%
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="px-4 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
