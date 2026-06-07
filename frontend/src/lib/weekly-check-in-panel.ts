import type { PlayerCurrencyReward, TextArtDesign } from "../objects/ui-customization/ui-customization-objects.js";

export const WEEKLY_CHECK_IN_DAY_COUNT = 7;

export const defaultWeeklyCheckInRewards = (): PlayerCurrencyReward[] => ([
  { coins: 10, gems: 0, fragments: 0 },
  { coins: 15, gems: 0, fragments: 0 },
  { coins: 20, gems: 0, fragments: 1 },
  { coins: 30, gems: 0, fragments: 0 },
  { coins: 35, gems: 0, fragments: 2 },
  { coins: 40, gems: 1, fragments: 0 },
  { coins: 50, gems: 2, fragments: 5 },
]);

export const weeklyCheckInButtonStates = () => ([
  {
    id: "ready",
    name: "可领取",
    label: "领取",
    contentType: "text" as const,
    icon: "gift",
    baseTemplateValue: "",
    patternTemplateValue: "",
    patternLayers: [],
    variant: "primary" as const,
    backgroundColor: "#2c68a8",
    textColor: "#ffffff",
  },
  {
    id: "claimed",
    name: "已领取",
    label: "已领",
    contentType: "text" as const,
    icon: "check",
    baseTemplateValue: "",
    patternTemplateValue: "",
    patternLayers: [],
    variant: "secondary" as const,
    backgroundColor: "#dceeff",
    textColor: "#12385f",
  },
  {
    id: "locked",
    name: "未解锁",
    label: "锁定",
    contentType: "text" as const,
    icon: "lock",
    baseTemplateValue: "",
    patternTemplateValue: "",
    patternLayers: [],
    variant: "ghost" as const,
    backgroundColor: "#f0f3f6",
    textColor: "#6b7785",
  },
]);

export const createWeeklyCheckInButtonDraft = (
  dayIndex: number,
  reward: PlayerCurrencyReward,
) => ({
  id: `day${dayIndex}`,
  type: "multiStateButton" as const,
  name: `第 ${dayIndex} 天`,
  position: {
    x: 4 + (dayIndex - 1) * 13.2,
    y: 58,
    width: 11.5,
    height: 18,
  },
  defaultStateId: "locked",
  rewardGrant: reward,
  states: weeklyCheckInButtonStates(),
});

export const createDefaultWeeklyCheckInChildDrafts = () => {
  const rewards = defaultWeeklyCheckInRewards();
  return [
    {
      id: "title",
      type: "text" as const,
      text: "每周签到",
      position: { x: 8, y: 8, width: 62, height: 12 },
      artTextDesign: {
        preset: "goldGradient",
        accentColor: "#ffd76a",
        gradientDirection: "toBottom",
        gradientIntensity: "normal",
      } satisfies TextArtDesign,
    },
    {
      id: "hint",
      type: "text" as const,
      text: "系统会根据本周已签到次数自动判定今天可领取哪一天。此处只需配置每个按钮实际发放的金币、钻石与碎片。",
      position: { x: 8, y: 24, width: 84, height: 18 },
      artTextDesign: { preset: "inkBrush", accentColor: "#2b4257" } satisfies TextArtDesign,
    },
    ...rewards.map((reward, index) => createWeeklyCheckInButtonDraft(index + 1, reward)),
    {
      id: "wallet",
      type: "text" as const,
      text: "玩家资产会在领取后实时更新：金币 / 钻石 / 碎片",
      position: { x: 8, y: 82, width: 84, height: 10 },
      artTextDesign: { preset: "sealCinnabar", accentColor: "#c62828", gradientDirection: "toRight", gradientIntensity: "soft" } satisfies TextArtDesign,
    },
    {
      id: "close",
      type: "multiStateButton" as const,
      name: "关闭按钮",
      position: { x: 84, y: 82, width: 10, height: 10 },
      defaultStateId: "close",
      states: [{
        id: "close",
        name: "正常",
        label: "关闭",
        contentType: "text" as const,
        icon: "x",
        baseTemplateValue: "",
        patternTemplateValue: "",
        patternLayers: [],
        variant: "secondary" as const,
        backgroundColor: "#dceeff",
        textColor: "#12385f",
      }],
    },
  ];
};

export const extractWeeklyCheckInRewards = (
  drafts: Array<{ id: string; type: string; rewardGrant?: PlayerCurrencyReward }>,
): PlayerCurrencyReward[] =>
  Array.from({ length: WEEKLY_CHECK_IN_DAY_COUNT }, (_, index) => {
    const draft = drafts.find((candidate) => candidate.id === `day${index + 1}`);
    return draft?.rewardGrant ?? defaultWeeklyCheckInRewards()[index]!;
  });

export const applyWeeklyCheckInRewards = <T extends { id: string; type: string; rewardGrant?: PlayerCurrencyReward }>(
  drafts: T[],
  rewards: PlayerCurrencyReward[],
): T[] =>
  drafts.map((draft) => {
    const match = draft.id.match(/^day(\d+)$/);
    if (!draft || draft.type !== "multiStateButton" || !match) {
      return draft;
    }

    const dayIndex = Number(match[1]);
    const reward = rewards[dayIndex - 1];
    if (!reward) {
      return draft;
    }

    return { ...draft, rewardGrant: reward };
  });
