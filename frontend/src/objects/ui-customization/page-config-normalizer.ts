import type { ComponentAction, PageComponent, PageConfig } from "./page-config.js";
import { createAdminProposalsPageConfig } from "./admin-proposals-structure.js";
import { isRoleLevelMapSyncPageId } from "../../lib/level-map-sync.js";
import {
  applyLevelNodeButtonFormat,
  extractLevelNodeButtonFormatSettings,
  isLevelNodeButtonComponent,
} from "../../lib/level-node-button-format.js";
import {
  LEVEL_MAP_STAGE_WIDGET_POSITION,
  LEVEL_MAP_STAGE_WIDGET_STYLE,
} from "./level-chain-home-structure.js";
import { LEVEL_MAP_PAGE_ID } from "./level-map-structure.js";
import {
  createDefaultLevelMapPathDesign,
  getDefaultLevelStageDecoration,
} from "./level-map-structure.js";
import { findStagePanel } from "../../lib/level-stage-structure.js";

const isPanel = (component: PageComponent) => component.type === "panel";

const getRootPanelTitle = (pageName: string) =>
  pageName.endsWith("主界面")
    ? `${pageName.slice(0, -"主界面".length)}主面板`
    : `${pageName}主面板`;

const getPanelTitle = (pageConfig: PageConfig, component: PageComponent, nextId: string) => {
  if (component.type !== "panel") {
    return undefined;
  }

  const currentTitle = component.title?.trim();
  if (currentTitle) {
    return currentTitle;
  }

  if (nextId === pageConfig.id) {
    return getRootPanelTitle(pageConfig.name);
  }

  switch (component.kind) {
    case "container":
      return getRootPanelTitle(pageConfig.name);
    case "stage":
      return "关卡界面";
    case "overlay":
      return "弹出功能面板";
    case "surface":
      return "界面区域";
    case "group":
      return "子面板";
    default:
      return "面板";
  }
};

const remapAction = (action: ComponentAction, idMap: Map<string, string>): ComponentAction => {
  if (action.type === "openPanel") {
    return {
      ...action,
      panelId: idMap.get(action.panelId) ?? action.panelId,
    };
  }

  return action;
};

const usesLegacyAdminProposalsShell = (pageConfig: PageConfig) =>
  pageConfig.id === "admin.proposals"
  && pageConfig.components.some((component) => component.id.includes(".shell"));

const shouldMigrateAdminProposals = (pageConfig: PageConfig) =>
  pageConfig.id === "admin.proposals"
  && (
    usesLegacyAdminProposalsShell
    || pageConfig.surfaceMode === "staticEmbed"
    || pageConfig.components.length === 0
    || pageConfig.components.some((component) => component.type === "panel")
    || pageConfig.layout.type !== "stack"
  );

export const normalizePageSurface = (pageConfig: PageConfig): PageConfig => {
  if (shouldMigrateAdminProposals(pageConfig)) {
    return createAdminProposalsPageConfig();
  }

  if (pageConfig.id === LEVEL_MAP_PAGE_ID) {
    return normalizeSharedLevelMapPageConfig(pageConfig);
  }

  if (isRoleLevelMapSyncPageId(pageConfig.id)) {
    return normalizeRoleHomePageConfig(pageConfig);
  }

  return pageConfig;
};

const normalizeSharedLevelMapPageConfig = (pageConfig: PageConfig): PageConfig => {
  const withStageDefaults: PageConfig = {
    ...pageConfig,
    components: pageConfig.components.map((component) => {
      if (component.type !== "panel" || component.kind !== "stage") {
        return component;
      }

      return {
        ...component,
        contentSize: component.contentSize ?? {
          widthPercent: 150,
          heightPercent: 125,
        },
        decoration: component.decoration ?? getDefaultLevelStageDecoration(),
        pathDesign: component.pathDesign ?? createDefaultLevelMapPathDesign(),
        style: {
          ...(component.style ?? {}),
          backgroundColor: component.style?.backgroundColor ?? "transparent",
        },
      };
    }),
  };

  if (!findStagePanel(withStageDefaults)) {
    return withStageDefaults;
  }

  return applyLevelNodeButtonFormat(
    withStageDefaults,
    extractLevelNodeButtonFormatSettings(withStageDefaults),
  );
};

const normalizeRoleHomePageConfig = (pageConfig: PageConfig): PageConfig =>
  normalizeRoleHomeChrome(migrateRoleHomeToLevelMapWidget(pageConfig));

const migrateRoleHomeToLevelMapWidget = (pageConfig: PageConfig): PageConfig => {
  const widgetComponentId = `${pageConfig.id}.levelMapStage`;
  const hasLevelMapWidget = pageConfig.components.some(
    (component) => component.type === "widget" && component.widgetId === "levelMapStage",
  );
  const hasLegacyStage = pageConfig.components.some(
    (component) => component.type === "panel" && component.kind === "stage",
  );
  const hasLegacyLevelButtons = pageConfig.components.some((component) =>
    component.type === "button" && isLevelNodeButtonComponent(component),
  );
  const hasLegacyMapViewportRef = pageConfig.components.some(
    (component) =>
      component.type === "panel"
      && component.kind === "container"
      && component.childComponentIds.some((childId) => childId.endsWith(".mapViewport")),
  );

  if (hasLevelMapWidget && !hasLegacyStage && !hasLegacyLevelButtons && !hasLegacyMapViewportRef) {
    return pageConfig;
  }

  const filteredComponents = pageConfig.components.filter((component) => {
    if (component.type === "panel" && component.kind === "stage") {
      return false;
    }

    if (component.type === "button") {
      if (component.id.endsWith(".stageSettingsButton") || isLevelNodeButtonComponent(component)) {
        return false;
      }
    }

    return true;
  });

  const levelMapWidget: PageComponent = {
    id: widgetComponentId,
    type: "widget",
    widgetId: "levelMapStage",
    position: LEVEL_MAP_STAGE_WIDGET_POSITION,
    style: LEVEL_MAP_STAGE_WIDGET_STYLE,
  };

  const nextComponents = (hasLevelMapWidget
    ? filteredComponents.map((component) =>
        component.type === "widget" && component.widgetId === "levelMapStage"
          ? {
              ...component,
              position: LEVEL_MAP_STAGE_WIDGET_POSITION,
              style: {
                ...(component.style ?? {}),
                ...LEVEL_MAP_STAGE_WIDGET_STYLE,
              },
            }
          : component,
      )
    : [...filteredComponents, levelMapWidget]);

  return {
    ...pageConfig,
    components: nextComponents.map((component) => {
      if (component.type !== "panel" || component.kind !== "container") {
        return component;
      }

      const childComponentIds = component.childComponentIds
        .filter(
          (childId) =>
            !childId.endsWith(".mapViewport")
            && !childId.endsWith(".stageSettingsButton")
            && !/\.level\d{2}$/.test(childId),
        );

      if (!childComponentIds.includes(widgetComponentId)) {
        childComponentIds.push(widgetComponentId);
      }

      return {
        ...component,
        childComponentIds,
      };
    }),
  };
};

const normalizeRoleHomeChrome = (pageConfig: PageConfig): PageConfig => ({
  ...pageConfig,
  components: pageConfig.components.map((component) => {
    if (component.type === "panel" && component.kind === "container") {
      return {
        ...component,
        position: {
          unit: "percent" as const,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        style: {
          ...(component.style ?? {}),
          backgroundColor: "transparent",
          borderRadius: 0,
        },
      };
    }

    if (component.type === "panel" && component.kind === "stage") {
      return component;
    }

    if (
      component.type === "text"
      && (component.id.endsWith(".heroTitle") || component.id.endsWith(".heroCopy"))
    ) {
      return {
        ...component,
        style: {
          ...(component.style ?? {}),
          backgroundColor: "transparent",
          borderRadius: 0,
        },
      };
    }

    return component;
  }),
});

export const normalizePageConfig = (pageConfig: PageConfig): PageConfig =>
  normalizePageSurface(normalizePageComponentIds(pageConfig));

export const normalizePageComponentIds = (pageConfig: PageConfig): PageConfig => {
  const componentById = new Map(pageConfig.components.map((component) => [component.id, component]));
  const childIdSet = new Set<string>();

  pageConfig.components.forEach((component) => {
    if (component.type === "panel") {
      component.childComponentIds.forEach((childId) => childIdSet.add(childId));
    }
  });

  const roots = pageConfig.components.filter((component) => !childIdSet.has(component.id));
  const rootComponents = roots.length > 0 ? roots : pageConfig.components.slice(0, 1);
  const idMap = new Map<string, string>();
  const visitedIds = new Set<string>();

  const assignTreeIds = (component: PageComponent, nextId: string) => {
    if (visitedIds.has(component.id)) {
      return;
    }

    visitedIds.add(component.id);
    idMap.set(component.id, nextId);

    if (component.type !== "panel") {
      return;
    }

    component.childComponentIds.forEach((childId, index) => {
      const child = componentById.get(childId);
      if (child) {
        assignTreeIds(child, `${nextId}.${index + 1}`);
      }
    });
  };

  rootComponents.forEach((component, index) => {
    const rootId = rootComponents.length === 1 && isPanel(component) ? pageConfig.id : `${pageConfig.id}.${index + 1}`;
    assignTreeIds(component, rootId);
  });

  pageConfig.components.forEach((component) => {
    if (!idMap.has(component.id)) {
      idMap.set(component.id, `${pageConfig.id}.${idMap.size + 1}`);
    }
  });

  return {
    ...pageConfig,
    components: pageConfig.components.map((component) => {
      const nextId = idMap.get(component.id) ?? component.id;

      if (component.type === "panel") {
        return {
          ...component,
          id: nextId,
          title: getPanelTitle(pageConfig, component, nextId),
          childComponentIds: component.childComponentIds
            .map((childId) => idMap.get(childId))
            .filter((childId): childId is string => Boolean(childId)),
        };
      }

      if (component.type === "button") {
        return {
          ...component,
          id: nextId,
          action: remapAction(component.action, idMap),
        };
      }

      return {
        ...component,
        id: nextId,
      };
    }),
  };
};
