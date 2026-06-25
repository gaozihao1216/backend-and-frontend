const storageKey = (userId: string) => `player-selected-bird-type:${userId}`;

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const readSelectedBirdType = (userId: string): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  const value = window.localStorage.getItem(storageKey(userId));
  return value && value.length > 0 ? value : null;
};

export const writeSelectedBirdType = (userId: string, birdType: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey(userId), birdType);
};
