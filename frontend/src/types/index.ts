export type Role = "OWNER" | "DEVELOPER" | "VIEWER";
export type MemberRole = Role;
export type Visibility = "PUBLIC" | "PRIVATE";
export type ProjectVisibility = Visibility;
export type MemberStatus = "ACTIVE" | "PENDING" | "INVITED" | "REMOVED";

// Auth Types
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  verified: boolean;
  created_at?: string;
  updated_at?: string;
}

// User Profile Types
export interface UserProfile {
  id: number;
  name?: string;
  email: string;
  bio?: string;
  skills?: string;
  college?: string;
  department?: string;
  social_links?: string;
  avatar_link?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRequest {
  name: string;
  email: string;
  bio?: string;
  skills?: string;
  college?: string;
  department?: string;
  social_links?: string;
  avatar_link?: string;
}

export type ProfileFieldKey =
  | "name"
  | "email"
  | "bio"
  | "skills"
  | "college"
  | "department"
  | "social_links"
  | "avatar_link";

export interface ProfileFieldItem {
  key: ProfileFieldKey;
  label: string;
  description: string;
  category: "Identity" | "About" | "Skills & Education" | "Online Presence";
  isFilled: boolean;
  value?: string;
  placeholder: string;
  requiredForCollab?: boolean;
}

export interface ProfileCompletionStats {
  percentage: number;
  filledCount: number;
  totalCount: number;
  missingCount: number;
  levelTitle: string;
  levelColor: string;
  fields: ProfileFieldItem[];
}

// Project Service Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  visibility: Visibility;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectRequest {
  name: string;
  description?: string;
  ownerId: number;
  visibility: Visibility;
}

export interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: Role;
  joinedAt?: string;
  status: MemberStatus;
}

export interface ProjectMemberRequest {
  userId: number;
  role: Role;
  status?: MemberStatus;
  senderName?: string;
}

export interface UpdateMemberRequest {
  role?: Role;
  status?: MemberStatus;
}

export interface ProjectDetailResponse {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  visibility: Visibility;
  createdAt?: string;
  updatedAt?: string;
  members: ProjectMember[];
}

// Notification Service Types
export interface Notification {
  id: string;
  userId: number;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
  projectId?: number;
  status?: string;
}

export interface UnreadCountResponse {
  count: number;
  userId: number;
}

export interface NotificationRequest {
  userId: number;
  message: string;
}

// ==========================================
// Repository / Monaco Editor Types
// ==========================================
export interface Branch {
  name: string;
  isDefault: boolean;
  latestCommitHash: string;
  latestCommitMessage: string;
  authorName: string;
  commitDate: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: "FILE" | "DIRECTORY";
  size: number;
  children?: FileNode[];
}

export interface FileContent {
  path: string;
  branch: string;
  content: string;
  size: number;
}

export interface CommitFileRequest {
  branch: string;
  path: string;
  content: string;
  commitMessage: string;
  authorName?: string;
  authorEmail?: string;
}

export interface CreateBranchRequest {
  branchName: string;
  baseBranch?: string;
}

export interface PullRequest {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  authorId: number;
  authorName?: string;
  ownerId?: number;
  status: "OPEN" | "MERGED" | "CLOSED";
  hasConflicts?: boolean;
  createdAt: string;
  mergedAt?: string;
  mergedByUserId?: number;
}

export interface CreatePullRequestRequest {
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch?: string;
  ownerId?: number;
}

export interface DiffResult {
  sourceBranch: string;
  targetBranch: string;
  rawDiff: string;
  changedFiles: string[];
  hasConflicts: boolean;
  conflictingFiles: string[];
}


