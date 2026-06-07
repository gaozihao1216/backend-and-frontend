import type { ComponentAction, PageConfig } from "./page-config.js";
import {
  createLevelNodeButtonAction,
  createDefaultLevelMapPathDesign,
  getDefaultLevelStageDecoration,
  LEVEL_NODE_DEFINITIONS,
} from "./level-map-structure.js";
import {
  createLevelNodeButtonStateDesign,
  getDefaultLevelNodeButtonFormatSettings,
} from "../../lib/level-node-button-format.js";

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

export const createLevelChainHomeComponents = ({
  prefix,
  title,
  statusLabel,
  actionLabel,
  actionOptions,
}: CreateLevelChainHomeComponentsInput): PageConfig["components"] => {
  const componentId = (suffix: string) => `${prefix}.${suffix}`;
  const buttonFormat = getDefaultLevelNodeButtonFormatSettings();
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
        backgroundColor: "transparent",
        borderRadius: 14,
      },
      decoration: getDefaultLevelStageDecoration(),
      pathDesign: createDefaultLevelMapPathDesign(),
      childComponentIds: LEVEL_NODE_DEFINITIONS.map((level) => componentId(level.suffix)),
    },
    ...LEVEL_NODE_DEFINITIONS.map((level) => ({
      id: componentId(level.suffix),
      type: "button" as const,
      label: level.label,
      icon: buttonFormat.stateIcons.notCleared,
      position: percentPosition(level.x, level.y, 16, 12),
      ...(buttonFormat.stateDesigns.notCleared.baseDesign
        ? { baseDesign: buttonFormat.stateDesigns.notCleared.baseDesign }
        : {}),
      style: {
        variant: buttonFormat.stateDesigns.notCleared.variant,
        backgroundColor: buttonFormat.stateDesigns.notCleared.backgroundColor,
        textColor: buttonFormat.stateDesigns.notCleared.textColor,
        borderRadius: buttonFormat.stateDesigns.notCleared.borderRadius,
        fontSize: Math.min(14, buttonFormat.stateDesigns.notCleared.fontSize),
      },
      stateDesign: createLevelNodeButtonStateDesign(level.suffix, level.label, buttonFormat),
      action: createLevelNodeButtonAction(level.suffix),
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
