import type { UiEndpoint } from "./page-config.js";

export type UiPreviewUser = {
  id: string;
  nickname: string;
  roleScope: UiEndpoint;
  roleLabel: string;
  apiUserId: string;
};

const previewUsersByEndpoint: Record<UiEndpoint, UiPreviewUser> = {
  player: {
    id: "ui-preview-player",
    nickname: "玩家测试账号",
    roleScope: "player",
    roleLabel: "玩家端",
    apiUserId: "player-1",
  },
  designer: {
    id: "ui-preview-designer",
    nickname: "设计师测试账号",
    roleScope: "designer",
    roleLabel: "设计师端",
    apiUserId: "designer-1",
  },
  admin: {
    id: "ui-preview-admin",
    nickname: "管理员测试账号",
    roleScope: "admin",
    roleLabel: "管理员端",
    apiUserId: "admin-1",
  },
  director: {
    id: "ui-preview-director",
    nickname: "总监测试账号",
    roleScope: "director",
    roleLabel: "总监端",
    apiUserId: "admin-director-1",
  },
};

export const getUiPreviewUser = (roleScope: UiEndpoint): UiPreviewUser =>
  previewUsersByEndpoint[roleScope];
