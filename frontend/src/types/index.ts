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
