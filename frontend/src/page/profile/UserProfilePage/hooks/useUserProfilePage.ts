import { useEffect, useState } from "react";
import type { UserProfile } from "../../../../objects/api/api-contracts.js";
import { getUserProfile } from "../../../../system/api/exports/index.js";

export const useUserProfilePage = (viewerUserId: string, profileUserId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const nextProfile = await getUserProfile(viewerUserId, profileUserId);
      setProfile(nextProfile);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [viewerUserId, profileUserId]);

  return {
    profile,
    loading,
    error,
    loadProfile,
  };
};
