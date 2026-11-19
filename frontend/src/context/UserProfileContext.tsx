"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  UserProfile,
  UserRequest,
  ProfileCompletionStats,
  ProfileFieldItem,
} from "@/types";
import { userApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  stats: ProfileCompletionStats;
  isEditModalOpen: boolean;
  openEditModal: () => void;
  closeEditModal: () => void;
  updateProfile: (data: Partial<UserRequest>) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  calculateStatsForData: (data: Partial<UserProfile | UserRequest>) => ProfileCompletionStats;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

const PROFILE_FIELDS_CONFIG: Array<{
  key: ProfileFieldItem["key"];
  label: string;
  description: string;
  category: ProfileFieldItem["category"];
  placeholder: string;
  requiredForCollab?: boolean;
}> = [
  {
    key: "name",
    label: "Full Name",
    description: "Your display name for teams and project collaborators",
    category: "Identity",
    placeholder: "e.g. Alex Rivera",
    requiredForCollab: true,
  },
  {
    key: "email",
    label: "Email Address",
    description: "Account contact and notification address",
    category: "Identity",
    placeholder: "e.g. alex@example.com",
    requiredForCollab: true,
  },
  {
    key: "bio",
    label: "Bio / About",
    description: "Brief summary about your developer background and interests",
    category: "About",
    placeholder: "e.g. Full-stack software developer passionate about cloud microservices...",
  },
  {
    key: "skills",
    label: "Skills & Tech Stack",
    description: "Key programming languages, frameworks, and technologies",
    category: "Skills & Education",
    placeholder: "e.g. React, Next.js, Java, Spring Boot, Docker, PostgreSQL",
    requiredForCollab: true,
  },
  {
    key: "college",
    label: "College / University",
    description: "Your university, institute, or educational background",
    category: "Skills & Education",
    placeholder: "e.g. Stanford University / MIT / IIT Delhi",
  },
  {
    key: "department",
    label: "Department / Major",
    description: "Academic department or engineering field",
    category: "Skills & Education",
    placeholder: "e.g. Computer Science & Engineering",
  },
  {
    key: "social_links",
    label: "Social / Portfolio Links",
    description: "GitHub, LinkedIn, or portfolio URL",
    category: "Online Presence",
    placeholder: "e.g. https://github.com/alexrivera",
  },
  {
    key: "avatar_link",
    label: "Avatar / Profile Photo",
    description: "Direct link to your profile avatar or picture",
    category: "Identity",
    placeholder: "e.g. https://api.dicebear.com/7.x/bottts/svg?seed=alex",
  },
];

export function computeProfileStats(
  data: Partial<UserProfile | UserRequest> | null
): ProfileCompletionStats {
  const fields: ProfileFieldItem[] = PROFILE_FIELDS_CONFIG.map((config) => {
    const rawVal = data ? (data as Record<string, unknown>)[config.key] : "";
    const stringVal = typeof rawVal === "string" ? rawVal.trim() : "";
    const isFilled = stringVal.length > 0;

    return {
      ...config,
      isFilled,
      value: stringVal,
    };
  });

  const filledCount = fields.filter((f) => f.isFilled).length;
  const totalCount = fields.length;
  const percentage = Math.round((filledCount / totalCount) * 100);
  const missingCount = totalCount - filledCount;

  let levelTitle = "Getting Started";
  let levelColor = "rose";

  if (percentage === 100) {
    levelTitle = "All-Star Profile";
    levelColor = "emerald";
  } else if (percentage >= 75) {
    levelTitle = "Advanced Profile";
    levelColor = "indigo";
  } else if (percentage >= 50) {
    levelTitle = "Intermediate Profile";
    levelColor = "blue";
  } else if (percentage >= 25) {
    levelTitle = "Basic Profile";
    levelColor = "amber";
  }

  return {
    percentage,
    filledCount,
    totalCount,
    missingCount,
    levelTitle,
    levelColor,
    fields,
  };
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const getStorageKey = useCallback(
    (idOrEmail: string | number) => `devcolab_profile_draft_${idOrEmail}`,
    []
  );

  // Load profile when user authenticates
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // First check local draft cache for instant responsiveness
    let cachedDraft: Partial<UserProfile> | null = null;
    try {
      const stored = localStorage.getItem(getStorageKey(currentUser.email));
      if (stored) {
        cachedDraft = JSON.parse(stored);
      }
    } catch {
      // Ignore localStorage parse errors
    }

    try {
      let fetched: UserProfile | null = null;
      try {
        fetched = await userApi.getByEmail(currentUser.email);
      } catch {
        // If not found by email, try by ID
        try {
          fetched = await userApi.getById(currentUser.id);
        } catch {
          // Profile may not exist yet in user service database
        }
      }

      if (fetched) {
        // Merge with any newer local cached values if present
        const merged: UserProfile = {
          ...fetched,
          name: fetched.name || cachedDraft?.name || "",
          bio: fetched.bio || cachedDraft?.bio || "",
          skills: fetched.skills || cachedDraft?.skills || "",
          college: fetched.college || cachedDraft?.college || "",
          department: fetched.department || cachedDraft?.department || "",
          social_links: fetched.social_links || cachedDraft?.social_links || "",
          avatar_link: fetched.avatar_link || cachedDraft?.avatar_link || "",
        };
        setProfile(merged);
        localStorage.setItem(getStorageKey(currentUser.email), JSON.stringify(merged));
      } else {
        // Provide local fallback profile using currentUser info
        const fallback: UserProfile = {
          id: currentUser.id,
          email: currentUser.email,
          name: cachedDraft?.name || "",
          bio: cachedDraft?.bio || "",
          skills: cachedDraft?.skills || "",
          college: cachedDraft?.college || "",
          department: cachedDraft?.department || "",
          social_links: cachedDraft?.social_links || "",
          avatar_link: cachedDraft?.avatar_link || "",
          created_at: currentUser.created_at,
          updated_at: currentUser.updated_at,
        };
        setProfile(fallback);
        localStorage.setItem(getStorageKey(currentUser.email), JSON.stringify(fallback));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load user profile";
      setError(msg);
      // Fallback state
      const fallback: UserProfile = {
        id: currentUser.id,
        email: currentUser.email,
        name: cachedDraft?.name || "",
        bio: cachedDraft?.bio || "",
        skills: cachedDraft?.skills || "",
        college: cachedDraft?.college || "",
        department: cachedDraft?.department || "",
        social_links: cachedDraft?.social_links || "",
        avatar_link: cachedDraft?.avatar_link || "",
      };
      setProfile(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, isAuthenticated, getStorageKey]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = async (data: Partial<UserRequest>): Promise<UserProfile> => {
    if (!currentUser) throw new Error("You must be logged in to update your profile");

    setIsLoading(true);
    setError(null);

    const safeName = (data.name?.trim() || profile?.name?.trim() || currentUser.email.split("@")[0]);
    const payload: UserRequest = {
      name: safeName,
      email: currentUser.email,
      bio: data.bio !== undefined ? data.bio : profile?.bio || "",
      skills: data.skills !== undefined ? data.skills : profile?.skills || "",
      college: data.college !== undefined ? data.college : profile?.college || "",
      department: data.department !== undefined ? data.department : profile?.department || "",
      social_links: data.social_links !== undefined ? data.social_links : profile?.social_links || "",
      avatar_link: data.avatar_link !== undefined ? data.avatar_link : profile?.avatar_link || "",
    };

    // Optimistically update local state
    const optimistic: UserProfile = {
      id: profile?.id || currentUser.id,
      ...payload,
      updated_at: new Date().toISOString(),
    };
    setProfile(optimistic);
    try {
      localStorage.setItem(getStorageKey(currentUser.email), JSON.stringify(optimistic));
    } catch {
      // ignore
    }

    try {
      let saved: UserProfile;
      if (profile?.id) {
        try {
          saved = await userApi.update(profile.id, payload);
        } catch (updateErr: unknown) {
          // If profile didn't exist in user service, create it
          const msg = updateErr instanceof Error ? updateErr.message : "";
          if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
            saved = await userApi.create(payload);
          } else {
            throw updateErr;
          }
        }
      } else {
        saved = await userApi.create(payload);
      }

      setProfile(saved);
      try {
        localStorage.setItem(getStorageKey(currentUser.email), JSON.stringify(saved));
      } catch {
        // ignore
      }
      return saved;
    } catch (err: unknown) {
      console.warn("Backend profile sync notice (saved locally):", err);
      // Keep optimistic version so user does not lose progress
      return optimistic;
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    return computeProfileStats(profile);
  }, [profile]);

  const calculateStatsForData = useCallback(
    (data: Partial<UserProfile | UserRequest>) => {
      return computeProfileStats(data);
    },
    []
  );

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  const value: UserProfileContextType = {
    profile,
    isLoading,
    error,
    stats,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    updateProfile,
    refreshProfile: loadProfile,
    calculateStatsForData,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile(): UserProfileContextType {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}
