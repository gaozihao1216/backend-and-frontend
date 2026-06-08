import type { ComponentAction, PageConfig } from "./page-config.js";

const percentPosition = (x: number, y: number, width: number, height: number) => ({
  unit: "percent" as const,
  x,
  y,
  width,
  height,
});

export const LEVEL_MAP_STAGE_WIDGET_POSITION = percentPosition(0, 18, 100, 82);

export const LEVEL_MAP_STAGE_WIDGET_STYLE = {
  borderRadius: 0,
};

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
      position: percentPosition(0, 0, 100, 100),
      style: {
        backgroundColor: "transparent",
        borderRadius: 0,
      },
      childComponentIds: [
        componentId("levelMapStage"),
        componentId("heroTitle"),
        componentId("heroCopy"),
        componentId("settingsButton"),
        componentId("statusButton"),
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
        backgroundColor: "transparent",
        textColor: "#12202f",
        borderRadius: 0,
        fontSize: 22,
      },
    },
    {
      id: componentId("heroCopy"),
      type: "text",
      text: "欢迎，{{nickname}}。链条式关卡是主舞台，功能以角落按钮展开。",
      position: percentPosition(3, 11, 62, 7),
      style: {
        backgroundColor: "transparent",
        textColor: "#3e544f",
        borderRadius: 0,
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
      action: { type: "openSettings" },
    },
    {
      id: componentId("levelMapStage"),
      type: "widget",
      widgetId: "levelMapStage",
      position: LEVEL_MAP_STAGE_WIDGET_POSITION,
      style: LEVEL_MAP_STAGE_WIDGET_STYLE,
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
