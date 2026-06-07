import type { ComponentAction, PageConfig } from "./page-config.js";

const percentPosition = (x: number, y: number, width: number, height: number) => ({
  unit: "percent" as const,
  x,
  y,
  width,
  height,
});

export type LevelNodeDefinition = {
  suffix: string;
  label: string;
  x: number;
  y: number;
  variant: "primary" | "secondary" | "ghost";
  story: string;
};

export const LEVEL_MAP_PAGE_ID = "shared.levelMap";
export const LEVEL_MAP_PATH = "/levels/map";

export const getDefaultLevelStageDecoration = () => ({
  templateId: "levelSky" as const,
  accentColor: "#6db8ff",
});

export const LEVEL_NODE_DEFINITIONS: LevelNodeDefinition[] = [
  {
    suffix: "level01",
    label: "01 草地训练场",
    x: 7,
    y: 22,
    variant: "primary",
    story: "熟悉弹射角度与基础结构破坏，是链条式关卡的第一站。",
  },
  {
    suffix: "level02",
    label: "02 风桥回旋点",
    x: 20,
    y: 42,
    variant: "primary",
    story: "风桥会把鸟弹到意料之外的位置，需要提前规划二段撞击。",
  },
  {
    suffix: "level03",
    label: "03 高塔猪舍",
    x: 34,
    y: 24,
    variant: "ghost",
    story: "穿过风桥后才能进入高塔猪舍，这里隐藏着更复杂的纵向结构机关。",
  },
  {
    suffix: "level04",
    label: "04 玻璃深谷",
    x: 48,
    y: 42,
    variant: "ghost",
    story: "深谷中的玻璃墙会连续反射冲击波，需要提前规划多段连锁坍塌。",
  },
  {
    suffix: "level05",
    label: "05 双城核心",
    x: 62,
    y: 24,
    variant: "ghost",
    story: "这是当前章节的终局关卡，双城核心需要同时摧毁左右两组能源塔。",
  },
  {
    suffix: "level06",
    label: "06 暮色仓场",
    x: 78,
    y: 42,
    variant: "ghost",
    story: "夕阳下的仓场堆满易燃木箱，需要快速拆掉关键承重点。",
  },
  {
    suffix: "level07",
    label: "07 碎岩坡道",
    x: 36,
    y: 66,
    variant: "ghost",
    story: "坡道上的滚石会改变撞击路径，稍有偏差就会错失连锁机会。",
  },
  {
    suffix: "level08",
    label: "08 寒雾驿站",
    x: 92,
    y: 66,
    variant: "ghost",
    story: "寒雾会遮挡部分视野，玩家需要依靠结构判断完成盲打。",
  },
  {
    suffix: "level09",
    label: "09 熔炉回廊",
    x: 112,
    y: 26,
    variant: "ghost",
    story: "高温熔炉会持续震动支架，拖延越久越容易引发意外坍塌。",
  },
  {
    suffix: "level10",
    label: "10 终章观测塔",
    x: 126,
    y: 46,
    variant: "ghost",
    story: "观测塔是测试章节的最终挑战，要求同时完成精确打点与资源分配。",
  },
];

export const getLevelScreenPageId = (levelSuffix: string) => `shared.level.${levelSuffix}`;

export const getLevelScreenPath = (levelSuffix: string) => `/levels/${levelSuffix}`;

export const createLevelNodeButtonAction = (levelSuffix: string): ComponentAction => ({
  type: "navigate",
  targetPageId: getLevelScreenPageId(levelSuffix),
  targetPath: getLevelScreenPath(levelSuffix),
});

export const createLevelMapStageComponents = (prefix: string): PageConfig["components"] => {
  const componentId = (suffix: string) => `${prefix}.${suffix}`;
  const stageId = componentId("mapViewport");

  return [
    {
      id: stageId,
      type: "panel",
      kind: "stage",
      title: "关卡路径地图",
      position: percentPosition(0, 0, 100, 100),
      contentSize: {
        widthPercent: 150,
        heightPercent: 125,
      },
      style: {
        backgroundColor: "transparent",
        borderRadius: 14,
      },
      decoration: getDefaultLevelStageDecoration(),
      childComponentIds: LEVEL_NODE_DEFINITIONS.map((level) => componentId(level.suffix)),
    },
    ...LEVEL_NODE_DEFINITIONS.map((level) => ({
      id: componentId(level.suffix),
      type: "button" as const,
      label: level.label,
      icon: "circle",
      position: percentPosition(level.x, level.y, 16, 12),
      style: { variant: level.variant, borderRadius: 999 },
      action: createLevelNodeButtonAction(level.suffix),
    })),
  ];
};

export const createLevelScreenComponents = (levelSuffix: string): PageConfig["components"] => {
  const level = LEVEL_NODE_DEFINITIONS.find((candidate) => candidate.suffix === levelSuffix);
  if (!level) {
    return [];
  }

  const pageId = getLevelScreenPageId(levelSuffix);
  const componentId = (part: string) => `${pageId}.${part}`;

  return [
    {
      id: pageId,
      type: "panel",
      kind: "surface",
      panelRole: "static",
      title: level.label,
      position: percentPosition(8, 8, 84, 84),
      style: {
        backgroundColor: "#fffdfa",
        borderRadius: 16,
      },
      childComponentIds: [
        componentId("title"),
        componentId("story"),
        componentId("preview"),
        componentId("start"),
        componentId("back"),
      ],
    },
    {
      id: componentId("title"),
      type: "text",
      text: level.label,
      position: percentPosition(6, 6, 88, 12),
      style: {
        backgroundColor: "transparent",
        textColor: "#12202f",
        borderRadius: 10,
        fontSize: 22,
      },
    },
    {
      id: componentId("story"),
      type: "text",
      text: level.story,
      position: percentPosition(6, 22, 88, 28),
      style: {
        backgroundColor: "transparent",
        textColor: "#3e544f",
        borderRadius: 10,
      },
    },
    {
      id: componentId("preview"),
      type: "text",
      text: "关卡简略预览区域（后续可接入真实试玩画布）",
      position: percentPosition(6, 54, 88, 22),
      style: {
        backgroundColor: "#f4f9ff",
        textColor: "#66867c",
        borderRadius: 12,
      },
    },
    {
      id: componentId("start"),
      type: "button",
      label: "开始游戏",
      icon: "play",
      position: percentPosition(6, 82, 40, 12),
      style: {
        variant: "primary",
        borderRadius: 12,
      },
      action: { type: "none" },
    },
    {
      id: componentId("back"),
      type: "button",
      label: "返回路径地图",
      icon: "arrow-left",
      position: percentPosition(54, 82, 40, 12),
      style: {
        variant: "secondary",
        borderRadius: 12,
      },
      action: {
        type: "navigate",
        targetPageId: LEVEL_MAP_PAGE_ID,
        targetPath: LEVEL_MAP_PATH,
      },
    },
  ];
};

export const createAllLevelScreenPageConfigs = (): PageConfig[] =>
  LEVEL_NODE_DEFINITIONS.map((level) => ({
    id: getLevelScreenPageId(level.suffix),
    name: level.label,
    path: getLevelScreenPath(level.suffix),
    roleScope: "player" as const,
    layout: { type: "freeform" as const, gap: 12, padding: 24 },
    components: createLevelScreenComponents(level.suffix),
  }));
