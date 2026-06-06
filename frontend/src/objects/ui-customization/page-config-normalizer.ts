import type { ComponentAction, PageComponent, PageConfig } from "./page-config.js";

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
