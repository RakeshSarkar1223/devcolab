"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { repoApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Branch, FileNode, PullRequest, DiffResult } from "@/types";

// Dynamically import Monaco to prevent SSR window issues
const Editor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-zinc-900 text-zinc-400 font-mono text-xs">
      Loading Monaco Editor...
    </div>
  ),
});

const DiffEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.DiffEditor), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-zinc-900 text-zinc-400 font-mono text-xs">
      Loading Diff Viewer...
    </div>
  ),
});

interface RepositoryViewerProps {
  projectId: number;
  projectName: string;
  isOwner: boolean;
  ownerId: number;
  onClose?: () => void;
}

export default function RepositoryViewer({
  projectId,
  projectName,
  isOwner,
  ownerId,
  onClose,
}: RepositoryViewerProps) {
  const { currentUser, isAuthenticated } = useAuth();

  // Active view: "code" | "prs" | "diff"
  const [activeSubTab, setActiveSubTab] = useState<"code" | "prs" | "diff">("code");

  // Repo State
  const [repoExists, setRepoExists] = useState<boolean | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>("main");
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [editorLanguage, setEditorLanguage] = useState<string>("plaintext");

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // New File modal state
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFileContent, setNewFileContent] = useState("");

  // New Branch modal state
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  // Commit modal state
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  // Pull Requests State
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [showNewPrModal, setShowNewPrModal] = useState(false);
  const [newPrTitle, setNewPrTitle] = useState("");
  const [newPrDesc, setNewPrDesc] = useState("");
  const [newPrSourceBranch, setNewPrSourceBranch] = useState("");
  const [selectedPr, setSelectedPr] = useState<PullRequest | null>(null);
  const [prDiff, setPrDiff] = useState<DiffResult | null>(null);

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
      case "mjs":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "java":
        return "java";
      case "json":
        return "json";
      case "html":
        return "html";
      case "css":
        return "css";
      case "md":
        return "markdown";
      case "sql":
        return "sql";
      case "xml":
        return "xml";
      case "yml":
      case "yaml":
        return "yaml";
      case "c":
      case "cpp":
      case "h":
        return "cpp";
      case "rs":
        return "rust";
      case "go":
        return "go";
      default:
        return "plaintext";
    }
  };

  const showFeedback = (text: string, isError = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // 1. Check or Init Repo
  const checkAndLoadRepo = useCallback(async () => {
    setLoading(true);
    try {
      const existsRes = await repoApi.checkRepoExists(projectId);
      if (!existsRes.exists) {
        // Auto-initialize if not yet created
        await repoApi.initRepo(projectId);
      }
      setRepoExists(true);
      await loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load repo";
      showFeedback(msg, true);
      setRepoExists(false);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    checkAndLoadRepo();
  }, [checkAndLoadRepo]);

  // 2. Load Branches
  const loadBranches = async () => {
    try {
      const branchList = await repoApi.getBranches(projectId);
      setBranches(branchList);
      if (branchList.length > 0 && !branchList.some((b) => b.name === currentBranch)) {
        setCurrentBranch(branchList[0].name);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // 3. Load Tree when branch changes
  const loadTree = useCallback(async (branch: string) => {
    try {
      const tree = await repoApi.getTree(projectId, branch);
      setFileTree(tree);
      // Auto-select README.md or first file if none selected
      if (tree.length > 0) {
        const readme = tree.find((f) => f.path.toLowerCase() === "readme.md") || tree[0];
        if (readme.type === "FILE") {
          loadFile(readme.path, branch);
        }
      } else {
        setSelectedFile(null);
        setFileContent("");
      }
    } catch (err: unknown) {
      console.error(err);
    }
  }, [projectId]);

  useEffect(() => {
    if (repoExists) {
      loadTree(currentBranch);
    }
  }, [repoExists, currentBranch, loadTree]);

  // 4. Load File Content
  const loadFile = async (filePath: string, branch = currentBranch) => {
    try {
      const fileData = await repoApi.getFileContent(projectId, branch, filePath);
      setSelectedFile(filePath);
      setFileContent(fileData.content);
      setOriginalContent(fileData.content);
      setEditorLanguage(getLanguageFromPath(filePath));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to read file";
      showFeedback(msg, true);
    }
  };

  // 5. Commit / Save Current File
  const handleSaveFile = async () => {
    if (!selectedFile) return;

    // Check branch rule: only owner can commit directly to main
    if (currentBranch === "main" && !isOwner) {
      showFeedback(
        "Direct commits to 'main' are restricted to the owner. Please switch to your branch or create one.",
        true
      );
      return;
    }

    setSaving(true);
    try {
      await repoApi.commitFile(projectId, {
        branch: currentBranch,
        path: selectedFile,
        content: fileContent,
        commitMessage: commitMessage || `Update ${selectedFile}`,
        authorName: currentUser?.email?.split("@")[0] || `User ${currentUser?.id}`,
        authorEmail: currentUser?.email || `user${currentUser?.id}@devcolab.local`,
      });

      setOriginalContent(fileContent);
      setShowCommitModal(false);
      setCommitMessage("");
      showFeedback(`Successfully committed to ${currentBranch}!`);
      await loadTree(currentBranch);
      await loadBranches();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to commit";
      showFeedback(msg, true);
    } finally {
      setSaving(false);
    }
  };

  // 6. Create New File
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;

    if (currentBranch === "main" && !isOwner) {
      showFeedback("Direct commits to 'main' are restricted to the owner. Switch to your branch first.", true);
      return;
    }

    setSaving(true);
    try {
      await repoApi.commitFile(projectId, {
        branch: currentBranch,
        path: newFilePath.trim(),
        content: newFileContent,
        commitMessage: `Create ${newFilePath.trim()}`,
        authorName: currentUser?.email?.split("@")[0] || `User ${currentUser?.id}`,
        authorEmail: currentUser?.email || `user${currentUser?.id}@devcolab.local`,
      });

      const createdPath = newFilePath.trim();
      setShowNewFileModal(false);
      setNewFilePath("");
      setNewFileContent("");
      showFeedback(`Created file '${createdPath}' on ${currentBranch}`);
      await loadTree(currentBranch);
      await loadFile(createdPath, currentBranch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create file";
      showFeedback(msg, true);
    } finally {
      setSaving(false);
    }
  };

  // 7. Create New Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    try {
      await repoApi.createBranch(projectId, {
        branchName: newBranchName.trim(),
        baseBranch: currentBranch,
      });
      showFeedback(`Branch '${newBranchName.trim()}' created!`);
      const name = newBranchName.trim();
      setShowNewBranchModal(false);
      setNewBranchName("");
      await loadBranches();
      setCurrentBranch(name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create branch";
      showFeedback(msg, true);
    }
  };

  // 8. Pull Requests Logic
  const loadPullRequests = useCallback(async () => {
    try {
      const prs = await repoApi.getPullRequests(projectId);
      setPullRequests(prs);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [projectId]);

  useEffect(() => {
    if (activeSubTab === "prs") {
      loadPullRequests();
    }
  }, [activeSubTab, loadPullRequests]);

  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrTitle.trim() || !newPrSourceBranch) return;

    try {
      await repoApi.createPullRequest(projectId, {
        title: newPrTitle.trim(),
        description: newPrDesc,
        sourceBranch: newPrSourceBranch,
        targetBranch: "main",
        ownerId: ownerId,
      });

      showFeedback("Pull Request submitted successfully!");
      setShowNewPrModal(false);
      setNewPrTitle("");
      setNewPrDesc("");
      loadPullRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create PR";
      showFeedback(msg, true);
    }
  };

  const handleViewPrDiff = async (pr: PullRequest) => {
    setSelectedPr(pr);
    try {
      const diff = await repoApi.getPullRequestDiff(projectId, pr.id);
      setPrDiff(diff);
      setActiveSubTab("diff");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load PR diff";
      showFeedback(msg, true);
    }
  };

  const handleMergePr = async (prId: number) => {
    try {
      await repoApi.mergePullRequest(projectId, prId);
      showFeedback(`Pull Request #${prId} merged into main!`);
      loadPullRequests();
      if (selectedPr?.id === prId) {
        setSelectedPr(null);
        setActiveSubTab("prs");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to merge PR";
      showFeedback(msg, true);
    }
  };

  const hasUnsavedChanges = fileContent !== originalContent;

  return (
    <div className="rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl overflow-hidden flex flex-col h-[750px]">
      {/* Top Header & Toolbar */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span className="text-blue-500">⌥</span> {projectName}
            <span className="text-zinc-400 font-normal">/</span>
            <span className="text-xs text-zinc-500 font-normal">repository</span>
          </span>

          {/* Sub Tabs */}
          <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveSubTab("code")}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeSubTab === "code"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              ⟨/⟩ Code
            </button>
            <button
              onClick={() => setActiveSubTab("prs")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === "prs"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span>⎇ Pull Requests</span>
              {pullRequests.filter((p) => p.status === "OPEN").length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
                  {pullRequests.filter((p) => p.status === "OPEN").length}
                </span>
              )}
            </button>
            {activeSubTab === "diff" && (
              <button className="px-3 py-1 rounded-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm">
                Diff Viewer
              </button>
            )}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {activeSubTab === "code" && (
            <>
              {/* Branch Selector */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 text-xs">
                <span className="text-zinc-400">⎇</span>
                <select
                  value={currentBranch}
                  onChange={(e) => setCurrentBranch(e.target.value)}
                  className="bg-transparent text-xs font-mono font-medium outline-none text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name} className="dark:bg-zinc-900">
                      {b.name} {b.isDefault ? "(default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* + New Branch */}
              <button
                onClick={() => setShowNewBranchModal(true)}
                className="px-2 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                title="Create a new branch"
              >
                + Branch
              </button>

              {/* + New File */}
              <button
                onClick={() => setShowNewFileModal(true)}
                className="px-2.5 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                title="Create a new file"
              >
                + File
              </button>

              {/* Save / Commit */}
              <button
                onClick={() => setShowCommitModal(true)}
                disabled={!hasUnsavedChanges || saving}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                  hasUnsavedChanges
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/20"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {saving ? "Saving..." : "Commit Changes"}
              </button>
            </>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              ✕ Exit
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
            statusMessage.isError
              ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
              : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="font-bold opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      {activeSubTab === "code" && (
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>Files</span>
              <span className="font-mono text-[10px] text-zinc-400">{fileTree.length} items</span>
            </div>

            {/* Branch Permission Banner */}
            {currentBranch === "main" && !isOwner && (
              <div className="p-2.5 m-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                🔒 <strong>Protected Branch:</strong> You are viewing <code>main</code>. Create your branch to commit code.
              </div>
            )}

            {/* Tree File List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {fileTree.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400">
                  No files found. Click <strong>+ File</strong> to create one.
                </div>
              ) : (
                fileTree.map((node) => {
                  const isSelected = selectedFile === node.path;
                  return (
                    <button
                      key={node.path}
                      onClick={() => loadFile(node.path)}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono flex items-center justify-between group transition-colors ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-zinc-400 text-xs">
                          {node.type === "DIRECTORY" ? "📁" : "📄"}
                        </span>
                        <span className="truncate">{node.path}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100">
                        {node.size > 0 ? `${node.size}B` : ""}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Info */}
            <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>Active: <strong className="font-mono text-zinc-600 dark:text-zinc-300">{currentBranch}</strong></span>
              {hasUnsavedChanges && (
                <span className="text-amber-500 font-medium">● Unsaved edits</span>
              )}
            </div>
          </div>

          {/* Monaco Editor Pane */}
          <div className="flex-1 flex flex-col bg-zinc-900">
            {/* Editor File Tab Bar */}
            <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-zinc-200 font-medium">{selectedFile || "No file selected"}</span>
                {hasUnsavedChanges && <span className="text-amber-400 font-bold">●</span>}
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>Language: <strong className="text-zinc-300">{editorLanguage}</strong></span>
                <span>Branch: <strong className="text-blue-400">{currentBranch}</strong></span>
              </div>
            </div>

            {/* The Monaco Editor */}
            <div className="flex-1 relative">
              <Editor
                height="100%"
                theme="vs-dark"
                language={editorLanguage}
                value={fileContent}
                onChange={(val) => setFileContent(val || "")}
                options={{
                  fontSize: 13,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  tabSize: 2,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pull Requests View */}
      {activeSubTab === "prs" && (
        <div className="flex-1 p-6 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/40">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Pull Requests
                </h3>
                <p className="text-xs text-zinc-500">
                  Propose changes, review diffs, and merge feature branches into <code>main</code>.
                </p>
              </div>
              <button
                onClick={() => setShowNewPrModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                + New Pull Request
              </button>
            </div>

            {pullRequests.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-400 text-xs">
                No Pull Requests yet. Create a feature branch, commit code, and open a Pull Request!
              </div>
            ) : (
              <div className="space-y-2.5">
                {pullRequests.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pr.status === "OPEN"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : pr.status === "MERGED"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {pr.status}
                        </span>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          #{pr.id} {pr.title}
                        </h4>
                        {pr.hasConflicts && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                            ⚠️ Conflicts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        By <span className="font-medium text-zinc-700 dark:text-zinc-300">{pr.authorName}</span>{" "}
                        wants to merge <code className="text-blue-500">{pr.sourceBranch}</code> into{" "}
                        <code className="text-zinc-600 dark:text-zinc-300">{pr.targetBranch}</code>
                      </p>
                      {pr.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 italic">
                          {pr.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewPrDiff(pr)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        Inspect Diff →
                      </button>
                      {isOwner && pr.status === "OPEN" && (
                        <button
                          onClick={() => handleMergePr(pr.id)}
                          disabled={pr.hasConflicts}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                            pr.hasConflicts
                              ? "bg-zinc-400 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          Merge PR
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diff Viewer Tab */}
      {activeSubTab === "diff" && selectedPr && prDiff && (
        <div className="flex-1 flex flex-col bg-zinc-950">
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="font-bold text-zinc-100">PR #{selectedPr.id}: {selectedPr.title}</span>
              <span className="text-zinc-500">|</span>
              <span className="text-blue-400">{prDiff.sourceBranch}</span>
              <span className="text-zinc-400">→</span>
              <span className="text-emerald-400">{prDiff.targetBranch}</span>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && selectedPr.status === "OPEN" && (
                <button
                  onClick={() => handleMergePr(selectedPr.id)}
                  disabled={prDiff.hasConflicts}
                  className={`px-3 py-1 rounded text-xs font-semibold text-white ${
                    prDiff.hasConflicts ? "bg-zinc-500 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {prDiff.hasConflicts ? "Cannot Merge (Conflicts)" : "Approve & Merge"}
                </button>
              )}
              <button
                onClick={() => setActiveSubTab("prs")}
                className="px-2.5 py-1 text-zinc-400 hover:text-white border border-zinc-700 rounded"
              >
                ← Back to PRs
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            <pre className="font-mono text-xs bg-zinc-900 text-zinc-200 p-4 rounded-lg overflow-x-auto whitespace-pre leading-relaxed border border-zinc-800">
              {prDiff.rawDiff || "No changes detected between branches."}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL: Commit Changes */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Commit Changes to <code className="text-blue-500">{currentBranch}</code>
            </h3>
            <p className="text-xs text-zinc-500">
              Your modifications to <strong>{selectedFile}</strong> will be stored into Git commit history.
            </p>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Commit Message
              </label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder={`Update ${selectedFile}`}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCommitModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFile}
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow"
              >
                {saving ? "Committing..." : "Commit Directly"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New File */}
      {showNewFileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFile}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Create New File in <code className="text-blue-500">{currentBranch}</code>
            </h3>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                File Path (e.g. <code>src/App.tsx</code>, <code>index.js</code>)
              </label>
              <input
                type="text"
                required
                value={newFilePath}
                onChange={(e) => setNewFilePath(e.target.value)}
                placeholder="src/utils.js"
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Initial Content (Optional)
              </label>
              <textarea
                rows={4}
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="// Enter code here"
                className="w-full text-xs p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFileModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
              >
                {saving ? "Creating..." : "Create File"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Create New Branch */}
      {showNewBranchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBranch}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Create New Branch
            </h3>
            <p className="text-xs text-zinc-500">
              Branching off from <strong>{currentBranch}</strong>. You can freely create and edit files on this branch.
            </p>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Branch Name
              </label>
              <input
                type="text"
                required
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder={currentUser ? `feature/user-${currentUser.id}` : "feature/my-branch"}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewBranchModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-lg shadow"
              >
                Create Branch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Create New Pull Request */}
      {showNewPrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePr}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Open a Pull Request
            </h3>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Source Branch (Your Branch)
              </label>
              <select
                required
                value={newPrSourceBranch}
                onChange={(e) => setNewPrSourceBranch(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 font-mono outline-none"
              >
                <option value="">Select branch to merge</option>
                {branches
                  .filter((b) => b.name !== "main")
                  .map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Branch
              </label>
              <input
                type="text"
                disabled
                value="main"
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 font-mono text-zinc-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                PR Title
              </label>
              <input
                type="text"
                required
                value={newPrTitle}
                onChange={(e) => setNewPrTitle(e.target.value)}
                placeholder="e.g. Add dashboard metrics"
                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={newPrDesc}
                onChange={(e) => setNewPrDesc(e.target.value)}
                placeholder="Describe your changes..."
                className="w-full text-xs p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewPrModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow"
              >
                Submit Pull Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
