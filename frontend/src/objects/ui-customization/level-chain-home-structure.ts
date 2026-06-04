import type { ComponentAction, PageConfig } from "./page-config.js";

const percentPosition = (x: number, y: number, width: number, height: number) => ({
  unit: "percent" as const,
  x,
  y,
  width,
  height,
});

type LevelChainActionOption = {
  id: string;
  label: string;
  icon?: string | undefined;
  action: ComponentAction;
  variant?: "primary" | "secondary" | "ghost" | undefined;
};

type CreateLevelChainHomeComponentsInput = {
  prefix: string;
  title: string;
  statusLabel: string;
  actionLabel: string;
  actionOptions: LevelChainActionOption[];
};

const levelNodes = [
  { suffix: "level01", label: "01 草地训练场", x: 7, y: 22, variant: "primary" as const },
  { suffix: "level02", label: "02 风桥回旋点", x: 20, y: 42, variant: "primary" as const },
  { suffix: "level03", label: "03 高塔猪舍", x: 34, y: 24, variant: "ghost" as const },
  { suffix: "level04", label: "04 玻璃深谷", x: 48, y: 42, variant: "ghost" as const },
  { suffix: "level05", label: "05 双城核心", x: 62, y: 24, variant: "ghost" as const },
  { suffix: "level06", label: "06 暮色仓场", x: 78, y: 42, variant: "ghost" as const },
  { suffix: "level07", label: "07 碎岩坡道", x: 36, y: 66, variant: "ghost" as const },
  { suffix: "level08", label: "08 寒雾驿站", x: 92, y: 66, variant: "ghost" as const },
  { suffix: "level09", label: "09 熔炉回廊", x: 112, y: 26, variant: "ghost" as const },
  { suffix: "level10", label: "10 终章观测塔", x: 126, y: 46, variant: "ghost" as const },
];

export const createLevelChainHomeComponents = ({
  prefix,
  title,
  statusLabel,
  actionLabel,
  actionOptions,
}: CreateLevelChainHomeComponentsInput): PageConfig["components"] => {
  const componentId = (suffix: string) => `${prefix}.${suffix}`;
  const actionOptionIds = actionOptions.map((option) => componentId(`action.${option.id}`));

  return [
    {
      id: componentId("dashboard"),
      type: "panel",
      kind: "container",
      position: percentPosition(2, 3, 96, 94),
      style: {
        backgroundColor: "#fffdfa",
        borderRadius: 14,
      },
      childComponentIds: [
        componentId("heroTitle"),
        componentId("heroCopy"),
        componentId("settingsButton"),
        componentId("mapViewport"),
        componentId("statusButton"),
        componentId("stageSettingsButton"),
        componentId("actionButton"),
        componentId("actionPanel"),
      ],
    },
    {
      id: componentId("heroTitle"),
      type: "text",
      text: title,
      position: percentPosition(3, 3, 28, 8),
      style: {
        backgroundColor: "#ffffff",
        textColor: "#12202f",
        borderRadius: 10,
        fontSize: 22,
      },
    },
    {
      id: componentId("heroCopy"),
      type: "text",
      text: "欢迎，{{nickname}}。链条式关卡是主舞台，功能以角落按钮展开。",
      position: percentPosition(3, 11, 62, 7),
      style: {
        backgroundColor: "#ffffff",
        textColor: "#3e544f",
        borderRadius: 10,
      },
    },
    {
      id: componentId("settingsButton"),
      type: "button",
      label: "设置",
      icon: "settings",
      position: percentPosition(86, 5, 10, 6),
      style: {
        variant: "secondary",
        borderRadius: 10,
      },
      action: { type: "none" },
    },
    {
      id: componentId("statusButton"),
      type: "button",
      label: statusLabel,
      icon: "user",
      position: percentPosition(7, 36, 10, 6),
      style: {
        variant: "secondary",
        borderRadius: 10,
      },
      action: { type: "none" },
    },
    {
      id: componentId("stageSettingsButton"),
      type: "button",
      label: "设置",
      icon: "settings",
      position: percentPosition(84, 36, 10, 6),
      style: {
        variant: "secondary",
        borderRadius: 10,
      },
      action: { type: "none" },
    },
    {
      id: componentId("mapViewport"),
      type: "panel",
      kind: "stage",
      position: percentPosition(3, 22, 94, 74),
      contentSize: {
        widthPercent: 150,
        heightPercent: 125,
      },
      style: {
        backgroundColor: "#f4f9ff",
        borderRadius: 14,
      },
      childComponentIds: levelNodes.map((level) => componentId(level.suffix)),
    },
    ...levelNodes.map((level) => ({
      id: componentId(level.suffix),
      type: "button" as const,
      label: level.label,
      icon: "circle",
      position: percentPosition(level.x, level.y, 16, 12),
      style: { variant: level.variant, borderRadius: 999 },
      action: { type: "none" as const },
    })),
    {
      id: componentId("actionButton"),
      type: "button",
      label: actionLabel,
      icon: "plus",
      position: percentPosition(84, 84, 10, 7),
      style: {
        variant: "primary",
        borderRadius: 10,
      },
      action: { type: "openPanel", panelId: componentId("actionPanel") },
    },
    {
      id: componentId("actionPanel"),
      type: "panel",
      kind: "overlay",
      position: percentPosition(67, 65, 24, 26),
      style: {
        backgroundColor: "#fffdfa",
        borderRadius: 12,
      },
      childComponentIds: [
        componentId("actionPanelTitle"),
        ...actionOptionIds,
      ],
    },
    {
      id: componentId("actionPanelTitle"),
      type: "text",
      text: "功能入口",
      position: percentPosition(8, 6, 48, 14),
      style: {
        backgroundColor: "#fffdfa",
        textColor: "#12202f",
        borderRadius: 10,
        fontSize: 16,
      },
    },
    ...actionOptions.map((option, index) => ({
      id: actionOptionIds[index] ?? componentId(`action.${option.id}`),
      type: "button" as const,
      label: option.label,
      icon: option.icon,
      position: percentPosition(8, 26 + index * 20, 66, 14),
      style: {
        variant: option.variant ?? "secondary",
        borderRadius: 10,
      },
      action: option.action,
    })),
  ];
};
