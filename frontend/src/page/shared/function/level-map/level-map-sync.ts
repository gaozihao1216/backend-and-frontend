export const ROLE_LEVEL_MAP_SYNC_PAGE_IDS = [
  "player.home",
  "designer.home",
  "admin.home",
  "director.home",
] as const;

export type RoleLevelMapSyncPageId = typeof ROLE_LEVEL_MAP_SYNC_PAGE_IDS[number];

export const isRoleLevelMapSyncPageId = (pageId: string): pageId is RoleLevelMapSyncPageId =>
  (ROLE_LEVEL_MAP_SYNC_PAGE_IDS as readonly string[]).includes(pageId);
