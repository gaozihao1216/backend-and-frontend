import type { UiEndpoint } from "../../../../objects/ui/page-config.js";
import type { UiPreviewAccount, UiPreviewUser } from "../../../../objects/ui-customization/preview-user.js";

export const PLAYER_WALLET_UI_DATA_KEY = "player.wallet";
export const PLAYER_LEVEL_PROGRESS_UI_DATA_KEY = "player.levelProgress";

export type UiTextRuntimeContext = {
  nickname: string;
  roleLabel: string;
  apiUserId: string;
  roleScope: UiEndpoint;
  coins: number;
  gems: number;
  fragments: number;
  clearedLevelCount: number;
};

const readNumberField = (value: unknown, field: string): number | undefined => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const raw = (value as Record<string, unknown>)[field];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
};

const readWalletFromUiData = (uiData?: Record<string, unknown>): UiPreviewAccount | undefined => {
  const payload = uiData?.[PLAYER_WALLET_UI_DATA_KEY];
  const coins = readNumberField(payload, "coins");
  const gems = readNumberField(payload, "gems");
  const fragments = readNumberField(payload, "fragments");

  if (coins === undefined && gems === undefined && fragments === undefined) {
    return undefined;
  }

  return {
    coins: coins ?? 0,
    gems: gems ?? 0,
    fragments: fragments ?? 0,
  };
};

const readClearedLevelCount = (uiData?: Record<string, unknown>): number | undefined =>
  readNumberField(uiData?.[PLAYER_LEVEL_PROGRESS_UI_DATA_KEY], "clearedCount");

export const buildUiTextRuntimeContext = (
  previewUser?: UiPreviewUser,
  uiData?: Record<string, unknown>,
): UiTextRuntimeContext | undefined => {
  if (!previewUser) {
    return undefined;
  }

  const walletFromApi = readWalletFromUiData(uiData);
  const clearedLevelCountFromApi = readClearedLevelCount(uiData);
  const account = previewUser.account;

  return {
    nickname: previewUser.nickname,
    roleLabel: previewUser.roleLabel,
    apiUserId: previewUser.apiUserId,
    roleScope: previewUser.roleScope,
    coins: walletFromApi?.coins ?? account?.coins ?? 0,
    gems: walletFromApi?.gems ?? account?.gems ?? 0,
    fragments: walletFromApi?.fragments ?? account?.fragments ?? 0,
    clearedLevelCount: clearedLevelCountFromApi ?? account?.clearedLevelCount ?? 0,
  };
};

export const formatUiTextRuntimeContextBlock = (context: UiTextRuntimeContext): string =>
  `{
  // 登录信息
  nickname: "${context.nickname}",
  roleLabel: "${context.roleLabel}",
  apiUserId: "${context.apiUserId}",
  roleScope: "${context.roleScope}",

  // 玩家资产（运行时从 player.wallet / player.levelProgress 读取）
  coins: ${context.coins},
  gems: ${context.gems},
  fragments: ${context.fragments},
  clearedLevelCount: ${context.clearedLevelCount}
}`;
