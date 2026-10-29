"use client";

import React, { useState, useEffect } from "react";
import { projectApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  MemberRole,
  MemberStatus,
  Project,
  ProjectDetailResponse,
  ProjectMember,
  ProjectRequest,
  ProjectVisibility,
} from "@/types";

interface ProjectsSectionProps {
  onNavigateToAuth?: () => void;
}

export default function ProjectsSection({ onNavigateToAuth }: ProjectsSectionProps) {
  const { currentUser, isAuthenticated } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state: 'all' | 'mine' | 'owner' | 'user'
  const [filterType, setFilterType] = useState<"all" | "mine" | "owner" | "user">("all");
  const [filterId, setFilterId] = useState("");

  // Create / Edit project form
  const [showCreate, setShowCreate] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [projectForm, setProjectForm] = useState<{
    name: string;
    description: string;
    visibility: ProjectVisibility;
  }>({
    name: "",
    description: "",
    visibility: "PUBLIC",
  });

  // Project details & members panel
  const [selectedProject, setSelectedProject] = useState<ProjectDetailResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Owner "Add Member Directly" form state
  const [memberUserId, setMemberUserId] = useState<string>("");
  const [memberRole, setMemberRole] = useState<MemberRole>("DEVELOPER");
  const [memberStatus, setMemberStatus] = useState<MemberStatus>("ACTIVE");
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // Non-owner "Request to Join" state
  const [requestedRole, setRequestedRole] = useState<MemberRole>("DEVELOPER");
  const [joinActionLoading, setJoinActionLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Project[] = [];
      if (filterType === "mine" && currentUser?.id) {
        data = await projectApi.getByOwner(currentUser.id);
      } else if (filterType === "owner" && filterId.trim()) {
        data = await projectApi.getByOwner(filterId.trim());
      } else if (filterType === "user" && filterId.trim()) {
        data = await projectApi.getByUser(filterId.trim());
      } else {
        data = await projectApi.getAll();
      }
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const handleOpenNewProject = () => {
    setError(null);
    setSuccess(null);

    // Guard: Only logged-in users can create a project
    if (!isAuthenticated || !currentUser) {
      setShowLoginPrompt(true);
      setShowCreate(false);
      return;
    }

    setEditingProjectId(null);
    setProjectForm({
      name: "",
      description: "",
      visibility: "PUBLIC",
    });
    setShowLoginPrompt(false);
    setShowCreate(!showCreate);
  };

  const handleCreateOrUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!editingProjectId && (!isAuthenticated || !currentUser)) {
      setError("Authentication required: You must be logged in to create a project.");
      setShowLoginPrompt(true);
      return;
    }

    try {
      if (editingProjectId) {
        // Only owner can update project
        const payload: ProjectRequest = {
          name: projectForm.name,
          description: projectForm.description,
          ownerId: currentUser?.id || 1,
          visibility: projectForm.visibility,
        };
        await projectApi.update(editingProjectId, payload);
        setSuccess(`Project #${editingProjectId} updated successfully`);
        setEditingProjectId(null);
      } else {
        // Creator is the default owner
        const payload: ProjectRequest = {
          name: projectForm.name,
          description: projectForm.description,
          ownerId: currentUser!.id,
          visibility: projectForm.visibility,
        };
        const created = await projectApi.create(payload);
        setSuccess(
          `Project "${created.name}" created with ID #${created.id}! You are assigned as the owner.`
        );
        setShowCreate(false);
      }

      setProjectForm({
        name: "",
        description: "",
        visibility: "PUBLIC",
      });
      fetchProjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    }
  };

  const handleStartEdit = (p: Project) => {
    if (!isAuthenticated || currentUser?.id !== p.ownerId) {
      setError("Permission denied: Only the owner of this project can edit it.");
      return;
    }
    setEditingProjectId(p.id);
    setProjectForm({
      name: p.name,
      description: p.description || "",
      visibility: p.visibility,
    });
    setShowCreate(true);
    setShowLoginPrompt(false);
  };

  const handleDeleteProject = async (p: Project) => {
    if (!isAuthenticated || currentUser?.id !== p.ownerId) {
      setError("Permission denied: Only the owner can delete this project.");
      return;
    }
    if (!confirm(`Are you sure you want to delete project #${p.id} "${p.name}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      await projectApi.delete(p.id);
      setSuccess(`Project #${p.id} deleted successfully.`);
      if (selectedProject?.id === p.id) setSelectedProject(null);
      fetchProjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const handleOpenDetails = async (id: number) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const data = await projectApi.getDetails(id);
      setSelectedProject(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load project details");
    } finally {
      setDetailsLoading(false);
    }
  };

  // OWNER ACTION: Add member directly
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    if (!isAuthenticated || currentUser?.id !== selectedProject.ownerId) {
      setError("Permission denied: Only the project owner can add members directly.");
      return;
    }

    setMemberActionLoading(true);
    setError(null);
    try {
      await projectApi.addMember(selectedProject.id, {
        userId: Number(memberUserId),
        role: memberRole,
        status: memberStatus,
      });
      setSuccess(`Member #${memberUserId} added to project!`);
      setMemberUserId("");
      handleOpenDetails(selectedProject.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setMemberActionLoading(false);
    }
  };

  // OWNER ACTION: Update member role or status (e.g. approve a pending request)
  const handleUpdateMember = async (
    memberId: number,
    role: MemberRole,
    status: MemberStatus
  ) => {
    if (!selectedProject) return;

    if (!isAuthenticated || currentUser?.id !== selectedProject.ownerId) {
      setError("Permission denied: Only the project owner can update member roles or approvals.");
      return;
    }

    try {
      await projectApi.updateMember(selectedProject.id, memberId, { role, status });
      setSuccess(
        status === "ACTIVE"
          ? `Member #${memberId} approved as active!`
          : `Member #${memberId} updated.`
      );
      handleOpenDetails(selectedProject.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    }
  };

  // OWNER ACTION (or member self-removal): Remove member
  const handleRemoveMember = async (member: ProjectMember) => {
    if (!selectedProject) return;

    const isOwner = currentUser?.id === selectedProject.ownerId;
    const isSelf = currentUser?.id === member.userId;

    if (!isAuthenticated || (!isOwner && !isSelf)) {
      setError("Permission denied: Only the project owner can remove members.");
      return;
    }

    // Owner cannot remove themselves from their own project
    if (isOwner && isSelf) {
      setError("The project owner cannot be removed from their own project.");
      return;
    }

    const actionText = isSelf ? "leave this project" : `remove member #${member.userId}`;
    if (!confirm(`Are you sure you want to ${actionText}?`)) return;

    try {
      await projectApi.removeMember(selectedProject.id, member.id);
      setSuccess(isSelf ? "You have left the project." : `Member #${member.userId} removed.`);
      handleOpenDetails(selectedProject.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  // NON-OWNER ACTION: Request to join project
  const handleRequestToJoin = async () => {
    if (!selectedProject) return;

    if (!isAuthenticated || !currentUser) {
      setShowLoginPrompt(true);
      return;
    }

    setJoinActionLoading(true);
    setError(null);
    try {
      await projectApi.addMember(selectedProject.id, {
        userId: currentUser.id,
        role: requestedRole,
        status: "PENDING", // Submit as pending join request
      });
      setSuccess(`Join request submitted! Awaiting approval from the project owner.`);
      handleOpenDetails(selectedProject.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit join request");
    } finally {
      setJoinActionLoading(false);
    }
  };

  // Helper values for selected project
  const isSelectedProjectOwner = Boolean(
    isAuthenticated && currentUser && selectedProject && currentUser.id === selectedProject.ownerId
  );

  const currentUserMembership = selectedProject?.members?.find(
    (m) => currentUser && m.userId === currentUser.id
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Project & Team Service
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse projects, collaborate with teams, or manage your owned projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Projects"}
          </button>

          {/* New Project Button with Auth Guard */}
          <button
            onClick={handleOpenNewProject}
            className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
              isAuthenticated
                ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 border border-zinc-700"
            }`}
          >
            {!isAuthenticated && <span>🔒</span>}
            {showCreate ? "Close Form" : "+ New Project"}
          </button>
        </div>
      </div>

      {/* Unauthenticated Alert Banner */}
      {!isAuthenticated && (
        <div className="p-4 rounded-lg border border-amber-300/60 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🔒</span>
            <div>
              <span className="font-semibold block">Public View Mode</span>
              <span className="text-amber-800/80 dark:text-amber-300/80">
                You can browse project descriptions. To create a project or request to join one, please sign in.
              </span>
            </div>
          </div>
          {onNavigateToAuth && (
            <button
              onClick={onNavigateToAuth}
              className="px-3 py-1.5 rounded-md bg-amber-900 text-white dark:bg-amber-100 dark:text-amber-950 font-medium whitespace-nowrap hover:opacity-90"
            >
              Sign In →
            </button>
          )}
        </div>
      )}

      {/* Modal / Alert when unauthenticated user tries to click "+ New Project" */}
      {showLoginPrompt && !isAuthenticated && (
        <div className="p-4 rounded-lg border border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30 text-xs text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <strong className="font-semibold block">Action Denied: Login Required</strong>
            <span>You must be signed in to create a project or send join requests.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="px-3 py-1.5 border border-rose-300 dark:border-rose-800 rounded text-rose-700 dark:text-rose-300"
            >
              Dismiss
            </button>
            {onNavigateToAuth && (
              <button
                onClick={onNavigateToAuth}
                className="px-3 py-1.5 bg-rose-900 text-white dark:bg-rose-100 dark:text-rose-950 rounded font-medium"
              >
                Go to Sign In →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
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

      {/* Filter Toolbar */}
      <div className="p-4 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-xs flex flex-wrap items-center gap-2.5">
        <span className="font-medium text-zinc-600 dark:text-zinc-400">Filter By:</span>
        <button
          onClick={() => {
            setFilterType("all");
            setFilterId("");
          }}
          className={`px-3 py-1 rounded-md text-xs font-medium ${
            filterType === "all"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          All Projects
        </button>

        {/* Quick filter: My Projects (only if logged in) */}
        {isAuthenticated && currentUser && (
          <button
            onClick={() => {
              setFilterType("mine");
              setFilterId("");
            }}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${
              filterType === "mine"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>👑</span>
            <span>My Projects (ID: #{currentUser.id})</span>
          </button>
        )}

        <button
          onClick={() => setFilterType("owner")}
          className={`px-3 py-1 rounded-md text-xs font-medium ${
            filterType === "owner"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          By Owner ID
        </button>
        <button
          onClick={() => setFilterType("user")}
          className={`px-3 py-1 rounded-md text-xs font-medium ${
            filterType === "user"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          By Member User ID
        </button>

        {(filterType === "owner" || filterType === "user") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProjects();
            }}
            className="flex items-center gap-2 ml-auto"
          >
            <input
              type="number"
              required
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              placeholder={`Enter ${filterType === "owner" ? "Owner" : "User"} ID...`}
              className="px-3 py-1 rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 w-36"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 rounded font-medium"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Create / Edit Project Form (Only accessible when logged in) */}
      {showCreate && isAuthenticated && currentUser && (
        <div className="p-5 rounded-lg border border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <div>
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                {editingProjectId ? `Edit Project #${editingProjectId}` : "Create New Project"}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                The logged-in user is automatically assigned as the project owner.
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {editingProjectId ? `PUT /api/projects/${editingProjectId}` : "POST /api/projects"}
            </span>
          </div>

          <form onSubmit={handleCreateOrUpdateProject} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="DevColab Microservices Platform"
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            {/* Default Owner Badge */}
            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Default Owner (Auto-assigned)
              </label>
              <div className="flex items-center justify-between px-3 py-2 rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                <div className="flex items-center gap-2 truncate">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-mono truncate">{currentUser.email}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold shrink-0">
                  ID: #{currentUser.id} (Owner)
                </span>
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Visibility
              </label>
              <select
                value={projectForm.visibility}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    visibility: e.target.value as ProjectVisibility,
                  })
                }
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Describe project goals, features, and tech stack..."
                className="w-full px-3 py-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditingProjectId(null);
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-600 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md font-medium"
              >
                {editingProjectId ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-zinc-400 border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 rounded-lg text-xs">
            {loading ? "Loading projects..." : "No projects found."}
          </div>
        ) : (
          projects.map((p) => {
            const isOwner = Boolean(isAuthenticated && currentUser && currentUser.id === p.ownerId);

            return (
              <div
                key={p.id}
                className={`p-4 rounded-lg border bg-white dark:bg-zinc-900 transition-all ${
                  selectedProject?.id === p.id
                    ? "border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-zinc-500">
                        #{p.id}
                      </span>
                      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {p.name}
                      </h3>
                      {isOwner && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          👑 Owner (You)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                      {p.description || "No description provided."}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                      p.visibility === "PUBLIC"
                        ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                        : "bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {p.visibility}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    Owner ID:{" "}
                    <strong className="font-mono text-zinc-700 dark:text-zinc-300">
                      #{p.ownerId}
                    </strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* View Details / Join Action */}
                    <button
                      onClick={() => handleOpenDetails(p.id)}
                      className={`px-2.5 py-1 rounded font-medium text-xs transition-colors ${
                        isOwner
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                      }`}
                    >
                      {isOwner ? "👑 Manage Members →" : "View & Join →"}
                    </button>

                    {/* ONLY Owner can Edit or Delete */}
                    {isOwner && (
                      <>
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          title="Edit Project"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p)}
                          className="p-1 text-zinc-400 hover:text-rose-600"
                          title="Delete Project"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Project Details Modal/Drawer */}
      {selectedProject && (
        <div className="p-6 rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900 shadow-md">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  Project #{selectedProject.id}
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedProject.name}
                </h3>
                {isSelectedProjectOwner ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    👑 You are the Owner
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800">
                    Owner: User #{selectedProject.ownerId}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                {selectedProject.description || "No description provided."}
              </p>
            </div>
            <button
              onClick={() => setSelectedProject(null)}
              className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700"
            >
              Close
            </button>
          </div>

          {/* ========================================================= */}
          {/* OWNER VIEW: FULL MEMBER MANAGEMENT & APPROVAL CONTROLS    */}
          {/* ========================================================= */}
          {isSelectedProjectOwner ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>👑 Owner Control: Team Members ({selectedProject.members?.length || 0})</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    As the owner, you can approve join requests, change roles, and remove members.
                  </p>
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  GET /api/projects/{selectedProject.id}/members
                </span>
              </div>

              {(!selectedProject.members || selectedProject.members.length === 0) ? (
                <p className="text-xs text-zinc-400 py-3">No members found in this project.</p>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                      <tr>
                        <th className="py-2.5 px-3">Member ID</th>
                        <th className="py-2.5 px-3">User ID</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {selectedProject.members.map((m) => {
                        const isMemberOwner = m.userId === selectedProject.ownerId;
                        const isPending = m.status === "PENDING";

                        return (
                          <tr
                            key={m.id}
                            className={
                              isPending
                                ? "bg-amber-50/40 dark:bg-amber-950/20"
                                : "hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                            }
                          >
                            <td className="py-2.5 px-3 font-mono text-zinc-500">#{m.id}</td>
                            <td className="py-2.5 px-3 font-medium">
                              User #{m.userId}
                              {isMemberOwner && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                                  Owner (You)
                                </span>
                              )}
                              {isPending && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">
                                  ⏳ Requested to Join
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isMemberOwner ? (
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  OWNER
                                </span>
                              ) : (
                                <select
                                  value={m.role}
                                  onChange={(e) =>
                                    handleUpdateMember(m.id, e.target.value as MemberRole, m.status)
                                  }
                                  className="px-2 py-1 text-xs rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                  <option value="DEVELOPER">DEVELOPER</option>
                                  <option value="VIEWER">VIEWER</option>
                                  <option value="OWNER">OWNER</option>
                                </select>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isMemberOwner ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ACTIVE
                                </span>
                              ) : (
                                <select
                                  value={m.status}
                                  onChange={(e) =>
                                    handleUpdateMember(m.id, m.role, e.target.value as MemberStatus)
                                  }
                                  className="px-2 py-1 text-xs rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                  <option value="ACTIVE">ACTIVE</option>
                                  <option value="PENDING">PENDING</option>
                                  <option value="INVITED">INVITED</option>
                                  <option value="REMOVED">REMOVED</option>
                                </select>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isMemberOwner ? (
                                <span className="text-zinc-400 text-[11px]">—</span>
                              ) : isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleUpdateMember(m.id, m.role, "ACTIVE")}
                                    className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMember(m)}
                                    className="px-2.5 py-1 rounded border border-rose-200 text-rose-600 text-[11px] hover:bg-rose-50"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleRemoveMember(m)}
                                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                                >
                                  Remove Member
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Owner Add Member Directly Form */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Add Collaborator Directly to Project
                </span>
                <form onSubmit={handleAddMember} className="flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="number"
                    required
                    value={memberUserId}
                    onChange={(e) => setMemberUserId(e.target.value)}
                    placeholder="User ID (e.g. 2)..."
                    className="px-3 py-1.5 rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 w-36"
                  />

                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as MemberRole)}
                    className="px-3 py-1.5 rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="DEVELOPER">Role: DEVELOPER</option>
                    <option value="VIEWER">Role: VIEWER</option>
                    <option value="OWNER">Role: OWNER</option>
                  </select>

                  <select
                    value={memberStatus}
                    onChange={(e) => setMemberStatus(e.target.value as MemberStatus)}
                    className="px-3 py-1.5 rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    <option value="ACTIVE">Status: ACTIVE</option>
                    <option value="PENDING">Status: PENDING</option>
                    <option value="INVITED">Status: INVITED</option>
                  </select>

                  <button
                    type="submit"
                    disabled={memberActionLoading}
                    className="px-3.5 py-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded font-medium hover:bg-zinc-800 transition-colors"
                  >
                    {memberActionLoading ? "Adding..." : "+ Add Member"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* NON-OWNER VIEW: DESCRIPTION & JOIN REQUEST ONLY           */
            /* ========================================================= */
            <div className="mt-5 space-y-5">
              {/* Project Members Count & Info */}
              <div className="p-4 rounded-md border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Project Collaboration Status
                  </span>
                  <span className="text-zinc-500">
                    Active Collaborators: {selectedProject.members?.filter((m) => m.status === "ACTIVE").length || 0}
                  </span>
                </div>
                <p className="text-zinc-500 mt-1">
                  Only the project owner (User #{selectedProject.ownerId}) can view full member lists, approve join requests, or remove members.
                </p>
              </div>

              {/* Join Request Area */}
              {!isAuthenticated ? (
                /* Unauthenticated Guest */
                <div className="p-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Want to collaborate on this project?
                    </h5>
                    <p className="text-zinc-500 mt-0.5">
                      Sign in to submit a join request to the project owner.
                    </p>
                  </div>
                  {onNavigateToAuth && (
                    <button
                      onClick={onNavigateToAuth}
                      className="px-3.5 py-1.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded font-medium hover:opacity-90"
                    >
                      Sign In to Join →
                    </button>
                  )}
                </div>
              ) : currentUserMembership ? (
                /* Already requested or is a member */
                <div className="p-4 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs space-y-3">
                  {currentUserMembership.status === "PENDING" && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40">
                      <div>
                        <span className="font-semibold block">⏳ Join Request Pending</span>
                        <span>Your request to join as <strong>{currentUserMembership.role}</strong> has been sent to the owner and is awaiting approval.</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(currentUserMembership)}
                        className="px-3 py-1.5 rounded border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100 text-xs whitespace-nowrap"
                      >
                        Cancel Request
                      </button>
                    </div>
                  )}

                  {currentUserMembership.status === "ACTIVE" && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/40">
                      <div>
                        <span className="font-semibold block">🎉 You are an Active Member</span>
                        <span>You are collaborating on this project as <strong>{currentUserMembership.role}</strong>.</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(currentUserMembership)}
                        className="px-3 py-1.5 rounded border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:bg-rose-50 text-xs whitespace-nowrap"
                      >
                        Leave Project
                      </button>
                    </div>
                  )}

                  {currentUserMembership.status === "REMOVED" && (
                    <div className="p-3 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      You are no longer an active member of this project.
                    </div>
                  )}
                </div>
              ) : (
                /* Authenticated, not a member yet: Show "Request to Join" form */
                <div className="p-4 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/40 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Request to Join &quot;{selectedProject.name}&quot;
                      </h5>
                      <p className="text-zinc-500 mt-0.5">
                        Send a collaborator request to User #{selectedProject.ownerId}.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-zinc-600 dark:text-zinc-400 font-medium">Desired Role:</label>
                      <select
                        value={requestedRole}
                        onChange={(e) => setRequestedRole(e.target.value as MemberRole)}
                        className="px-3 py-1.5 rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                      >
                        <option value="DEVELOPER">DEVELOPER (Contribute code & features)</option>
                        <option value="VIEWER">VIEWER (Read-only access)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleRequestToJoin}
                      disabled={joinActionLoading}
                      className="px-4 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      {joinActionLoading ? "Sending Request..." : "✋ Send Join Request"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
