"use client";

import React, { useState, useEffect } from "react";
import { userApi } from "@/lib/api";
import { UserProfile, UserRequest } from "@/types";

export default function UsersSection() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
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

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (editingUser?.id) {
        await userApi.update(editingUser.id, formData);
        setSuccess(`User profile #${editingUser.id} updated successfully!`);
        setEditingUser(null);
      } else {
        const created = await userApi.create(formData);
        setSuccess(`User profile #${created.id} created successfully!`);
        setShowCreate(false);
      }
      setFormData({
        name: "",
        email: "",
        bio: "",
        skills: "",
        college: "",
        department: "",
        social_links: "",
        avatar_link: "",
      });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user profile");
    }
  };

  const handleStartEdit = (u: UserProfile) => {
    setEditingUser(u);
    setFormData({
      name: u.name || "",
      email: u.email || "",
      bio: u.bio || "",
      skills: u.skills || "",
      college: u.college || "",
      department: u.department || "",
      social_links: u.social_links || "",
      avatar_link: u.avatar_link || "",
    });
    setShowCreate(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete user #${id}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await userApi.delete(id);
      setSuccess(`User #${id} deleted successfully`);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      let result: UserProfile;
      if (searchQuery.includes("@")) {
        result = await userApi.getByEmail(searchQuery.trim());
      } else {
        result = await userApi.getById(searchQuery.trim());
      }
      setSearchResult(result);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "User not found");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            User Service Profiles
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage user profiles via{" "}
            <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
              /api/user
            </code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Users"}
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({
                name: "",
                email: "",
                bio: "",
                skills: "",
                college: "",
                department: "",
                social_links: "",
                avatar_link: "",
              });
              setShowCreate(!showCreate);
            }}
            className="px-3.5 py-2 text-xs font-medium rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            {showCreate ? "Close Form" : "+ Create Profile"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs">
          {success}
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user by ID (e.g. 1) or by Email (e.g. user@example.com)..."
            className="flex-1 px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md font-medium hover:bg-zinc-800 transition-colors"
          >
            {searchLoading ? "Searching..." : "Lookup User"}
          </button>
        </form>

        {searchError && (
          <p className="mt-2 text-rose-600 dark:text-rose-400 text-xs">{searchError}</p>
        )}

        {searchResult && (
          <div className="mt-3 p-3 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                User #{searchResult.id}: {searchResult.name || "No name"} ({searchResult.email})
              </span>
              <button
                onClick={() => setSearchResult(null)}
                className="text-zinc-400 hover:text-zinc-600 text-xs"
              >
                Clear
              </button>
            </div>
            <p className="text-zinc-500 mt-1">
              Skills: {searchResult.skills || "N/A"} | College: {searchResult.college || "N/A"} | Department: {searchResult.department || "N/A"}
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Form */}
      {showCreate && (
        <div className="p-5 rounded-lg border border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {editingUser ? `Edit Profile (User #${editingUser.id})` : "Create New User Profile"}
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {editingUser ? `PUT /api/user/${editingUser.id}` : "POST /api/user"}
            </span>
          </div>

          <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Bio
              </label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Software engineer passionate about distributed systems..."
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Java, Spring Boot, React, Kafka"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                College / University
              </label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                placeholder="MIT / Stanford / IIT"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Computer Science"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Social Links (JSON or URL)
              </label>
              <input
                type="text"
                value={formData.social_links}
                onChange={(e) => setFormData({ ...formData, social_links: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Avatar Image Link
              </label>
              <input
                type="url"
                value={formData.avatar_link}
                onChange={(e) => setFormData({ ...formData, avatar_link: e.target.value })}
                placeholder="https://avatar.vercel.sh/user"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md font-medium"
              >
                {editingUser ? "Save Changes" : "Create Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table / Grid */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            Registered Profiles ({users.length})
          </span>
          <span className="text-xs text-zinc-400 font-mono">GET /api/user</span>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-xs">
            {loading ? "Loading user profiles..." : "No users found in database."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  <th className="py-2.5 px-3 font-medium">ID</th>
                  <th className="py-2.5 px-3 font-medium">Name & Email</th>
                  <th className="py-2.5 px-3 font-medium">Skills</th>
                  <th className="py-2.5 px-3 font-medium">College / Dept</th>
                  <th className="py-2.5 px-3 font-medium">Bio</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      #{u.id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {u.name || "—"}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {u.email}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {u.skills ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {u.skills.split(",").map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300"
                            >
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                      <div>{u.college || "—"}</div>
                      <div className="text-[11px] text-zinc-400">{u.department}</div>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 max-w-[180px] truncate">
                      {u.bio || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="px-2 py-1 rounded text-[11px] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="px-2 py-1 rounded text-[11px] border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
