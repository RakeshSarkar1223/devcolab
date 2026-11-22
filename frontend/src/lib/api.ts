import {
  AuthResponse,
  Branch,
  CommitFileRequest,
  CreateBranchRequest,
  CreatePullRequestRequest,
  CurrentUser,
  DiffResult,
  FileContent,
  FileNode,
  LoginRequest,
  Notification,
  NotificationRequest,
  Project,
  ProjectDetailResponse,
  ProjectMember,
  ProjectMemberRequest,
  ProjectRequest,
  PullRequest,
  RegisterRequest,
  UnreadCountResponse,
  UpdateMemberRequest,
  UserProfile,
  UserRequest,
} from "@/types";

const TOKEN_KEY = "devcolab_auth_token";
const USER_KEY = "devcolab_auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): AuthResponse | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthResponse): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const user = getStoredUser();
  if (user?.id && !headers["X-User-Id"]) {
    headers["X-User-Id"] = String(user.id);
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (netErr: unknown) {
    const msg = netErr instanceof Error ? netErr.message : "Network error";
    throw new Error(`Connection failed: ${msg}. Make sure backend services and API Gateway (8080) are running.`);
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      if (isJson) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } else {
        const text = await response.text();
        if (text) {
          if (text.includes("<html") || text.includes("Whitelabel Error")) {
            if (response.status === 500) {
              errorMessage = "Gateway 500: Microservice instance not found in Eureka or server error.";
            } else if (response.status === 503) {
              errorMessage = "Gateway 503: Service Unavailable. Eureka registry route is not ready.";
            } else if (response.status === 404) {
              errorMessage = "Gateway 404: Endpoint not found.";
            } else {
              errorMessage = `Gateway Error (${response.status}): ${response.statusText}`;
            }
          } else {
            errorMessage = text;
          }
        }
      }
    } catch {
      // fallback
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return text as unknown as T;
}

// ==========================================
// Auth Service API
// ==========================================
export const authApi = {
  async hello(): Promise<string> {
    return request<string>("/api/auth/hello");
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.token) {
      setStoredToken(res.token);
      setStoredUser(res);
    }
    return res;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.token) {
      setStoredToken(res.token);
      setStoredUser(res);
    }
    return res;
  },

  async getCurrentUser(): Promise<CurrentUser> {
    return request<CurrentUser>("/api/auth/me");
  },
};

// ==========================================
// User Service API
// ==========================================
export const userApi = {
  async hello(): Promise<string> {
    return request<string>("/api/user/hello");
  },

  async getAll(): Promise<UserProfile[]> {
    return request<UserProfile[]>("/api/user");
  },

  async getById(id: number | string): Promise<UserProfile> {
    return request<UserProfile>(`/api/user/${id}`);
  },

  async getByEmail(email: string): Promise<UserProfile> {
    return request<UserProfile>(`/api/user/email/${encodeURIComponent(email)}`);
  },

  async create(data: UserRequest): Promise<UserProfile> {
    return request<UserProfile>("/api/user", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number | string, data: Partial<UserRequest>): Promise<UserProfile> {
    return request<UserProfile>(`/api/user/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number | string): Promise<void> {
    await request<void>(`/api/user/${id}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// Project Service API
// ==========================================
export const projectApi = {
  async hello(): Promise<string> {
    return request<string>("/api/projects/hello");
  },

  async getAll(userId?: number | string): Promise<Project[]> {
    const q = userId ? `?userId=${userId}` : "";
    return request<Project[]>(`/api/projects${q}`);
  },

  async getById(id: number | string, userId?: number | string): Promise<Project> {
    const q = userId ? `?userId=${userId}` : "";
    return request<Project>(`/api/projects/${id}${q}`);
  },

  async getDetails(id: number | string, userId?: number | string): Promise<ProjectDetailResponse> {
    const q = userId ? `?userId=${userId}` : "";
    return request<ProjectDetailResponse>(`/api/projects/${id}/details${q}`);
  },

  async getByOwner(ownerId: number | string, userId?: number | string): Promise<Project[]> {
    const q = userId ? `?userId=${userId}` : "";
    return request<Project[]>(`/api/projects/owner/${ownerId}${q}`);
  },

  async getByUser(userId: number | string): Promise<Project[]> {
    return request<Project[]>(`/api/projects/user/${userId}`);
  },

  async create(data: ProjectRequest): Promise<Project> {
    return request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: number | string, data: ProjectRequest): Promise<Project> {
    return request<Project>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number | string): Promise<void> {
    await request<void>(`/api/projects/${id}`, {
      method: "DELETE",
    });
  },

  // Member Endpoints
  async getMembers(projectId: number | string): Promise<ProjectMember[]> {
    return request<ProjectMember[]>(`/api/projects/${projectId}/members`);
  },

  async getMember(projectId: number | string, memberId: number | string): Promise<ProjectMember> {
    return request<ProjectMember>(`/api/projects/${projectId}/members/${memberId}`);
  },

  async addMember(projectId: number | string, data: ProjectMemberRequest): Promise<ProjectMember> {
    return request<ProjectMember>(`/api/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateMember(
    projectId: number | string,
    memberId: number | string,
    data: UpdateMemberRequest
  ): Promise<ProjectMember> {
    return request<ProjectMember>(`/api/projects/${projectId}/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async removeMember(projectId: number | string, memberId: number | string): Promise<void> {
    await request<void>(`/api/projects/${projectId}/members/${memberId}`, {
      method: "DELETE",
    });
  },

  async acceptInvitation(projectId: number | string, userId: number | string): Promise<ProjectMember> {
    return request<ProjectMember>(
      `/api/projects/${projectId}/members/${userId}/accept`,
      {
        method: "POST",
      }
    );
  },

  async rejectInvitation(projectId: number | string, userId: number | string): Promise<void> {
    await request<void>(
      `/api/projects/${projectId}/members/${userId}/reject`,
      {
        method: "POST",
      }
    );
  },
};

// ==========================================
// Notification Service API
// ==========================================
export const notificationApi = {
  async hello(): Promise<string> {
    return request<string>("/api/notifications/hello");
  },

  async getAll(): Promise<Notification[]> {
    return request<Notification[]>("/api/notifications");
  },

  async getUnread(): Promise<Notification[]> {
    return request<Notification[]>("/api/notifications/unread");
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    return request<UnreadCountResponse>("/api/notifications/unread-count");
  },

  async getById(id: string): Promise<Notification> {
    return request<Notification>(`/api/notifications/${id}`);
  },

  async markAsRead(id: string): Promise<Notification> {
    return request<Notification>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  async markAllAsRead(): Promise<{ message: string; updatedCount: number; userId?: number }> {
    return request<{ message: string; updatedCount: number; userId?: number }>("/api/notifications/read-all", {
      method: "PATCH",
    });
  },

  async updateStatus(id: string, status: string): Promise<Notification> {
    return request<Notification>(`/api/notifications/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  async delete(id: string): Promise<void> {
    await request<void>(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  },

  async create(data: NotificationRequest): Promise<Notification> {
    return request<Notification>("/api/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ==========================================
// Repository Service API
// ==========================================
export const repoApi = {
  async initRepo(projectId: number): Promise<{ message: string; projectId: number; defaultBranch: string }> {
    return request<{ message: string; projectId: number; defaultBranch: string }>(`/api/repos/${projectId}/init`, {
      method: "POST",
    });
  },

  async checkRepoExists(projectId: number): Promise<{ projectId: number; exists: boolean }> {
    return request<{ projectId: number; exists: boolean }>(`/api/repos/${projectId}/exists`);
  },

  async getBranches(projectId: number): Promise<Branch[]> {
    return request<Branch[]>(`/api/repos/${projectId}/branches`);
  },

  async createBranch(projectId: number, data: CreateBranchRequest): Promise<{ message: string; branch: string }> {
    return request<{ message: string; branch: string }>(`/api/repos/${projectId}/branches`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getTree(projectId: number, branch?: string, subPath?: string): Promise<FileNode[]> {
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    if (subPath) params.set("subPath", subPath);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request<FileNode[]>(`/api/repos/${projectId}/tree${query}`);
  },

  async getFileContent(projectId: number, branch: string, path: string): Promise<FileContent> {
    const params = new URLSearchParams({ branch, path });
    return request<FileContent>(`/api/repos/${projectId}/blob?${params.toString()}`);
  },

  async commitFile(projectId: number, data: CommitFileRequest): Promise<{ message: string; branch: string; path: string }> {
    return request<{ message: string; branch: string; path: string }>(`/api/repos/${projectId}/commit`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getBranchDiff(projectId: number, sourceBranch: string, targetBranch: string = "main"): Promise<DiffResult> {
    const params = new URLSearchParams({ sourceBranch, targetBranch });
    return request<DiffResult>(`/api/repos/${projectId}/diff?${params.toString()}`);
  },

  async createPullRequest(projectId: number, data: CreatePullRequestRequest): Promise<PullRequest> {
    return request<PullRequest>(`/api/repos/${projectId}/pull-requests`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getPullRequests(projectId: number, status?: "OPEN" | "MERGED" | "CLOSED"): Promise<PullRequest[]> {
    const query = status ? `?status=${status}` : "";
    return request<PullRequest[]>(`/api/repos/${projectId}/pull-requests${query}`);
  },

  async getPullRequest(projectId: number, prId: number): Promise<PullRequest> {
    return request<PullRequest>(`/api/repos/${projectId}/pull-requests/${prId}`);
  },

  async getPullRequestDiff(projectId: number, prId: number): Promise<DiffResult> {
    return request<DiffResult>(`/api/repos/${projectId}/pull-requests/${prId}/diff`);
  },

  async mergePullRequest(projectId: number, prId: number): Promise<PullRequest> {
    return request<PullRequest>(`/api/repos/${projectId}/pull-requests/${prId}/merge`, {
      method: "POST",
    });
  },

  async closePullRequest(projectId: number, prId: number): Promise<PullRequest> {
    return request<PullRequest>(`/api/repos/${projectId}/pull-requests/${prId}/close`, {
      method: "POST",
    });
  },
};

