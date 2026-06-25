import { useMemo, useState } from "react";
import { getPageConfig, savePageConfig } from "../../../shared/function/ui-config/ui-customization.js";
import { isDynamicPath, routeTrees, type SelectedRoute } from "../../../../objects/ui-customization/ui-route-tree.js";
import type {
  ButtonComponent,
  ComponentAction,
  PageComponent,
  PageConfig,
  PanelComponent,
  UiEndpoint,
} from "../../../../objects/ui-customization/ui-customization-objects.js";

const findButton = (pageConfig: PageConfig | null, componentId: string | null): ButtonComponent | null => {
  const component = componentId ? pageConfig?.components.find((candidate) => candidate.id === componentId) : null;
  return component?.type === "button" ? component : null;
};

const getActionMode = (action: ComponentAction): "navigate" | "openPanel" =>
  action.type === "openPanel" ? "openPanel" : "navigate";

export const useDirectorButtonConfigPage = (pageId: string | null, componentId: string | null) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => pageId ? getPageConfig(pageId) : null);
  const selectedButton = useMemo(() => findButton(pageConfig, componentId), [componentId, pageConfig]);
  const [actionMode, setActionMode] = useState<"navigate" | "openPanel">(() =>
    selectedButton ? getActionMode(selectedButton.action) : "navigate",
  );
  const [targetPath, setTargetPath] = useState(() =>
    selectedButton?.action.type === "navigate" ? selectedButton.action.targetPath : "",
  );
  const [targetPageId, setTargetPageId] = useState(() =>
    selectedButton?.action.type === "navigate" ? selectedButton.action.targetPageId : "",
  );
  const [panelId, setPanelId] = useState(() =>
    selectedButton?.action.type === "openPanel" ? selectedButton.action.panelId : "",
  );
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  const [routePickerEndpoint, setRoutePickerEndpoint] = useState<UiEndpoint>(() => pageConfig?.roleScope ?? "player");
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute>(() => routeTrees[pageConfig?.roleScope ?? "player"]);
  const [feedback, setFeedback] = useState("");

  const availablePanels = useMemo(
    () => pageConfig?.components.filter((component): component is PanelComponent => component.type === "panel") ?? [],
    [pageConfig],
  );
  const selectedPanel = useMemo(
    () => availablePanels.find((panel) => panel.id === panelId) ?? null,
    [availablePanels, panelId],
  );
  const componentMap = useMemo(
    () => new Map((pageConfig?.components ?? []).map((component) => [component.id, component])),
    [pageConfig],
  );
  const selectedPanelChildren = selectedPanel
    ? selectedPanel.childComponentIds.map((childId) => componentMap.get(childId)).filter((component): component is PageComponent => Boolean(component))
    : [];
  const routePickerTree = routeTrees[routePickerEndpoint];

  const handleActionModeChange = (mode: "navigate" | "openPanel") => {
    setActionMode(mode);
    setFeedback("");
  };

  const handleSelectRoute = (route: SelectedRoute) => {
    setSelectedRoute(route);
    if (!isDynamicPath(route.path)) {
      setTargetPageId(route.pageId);
      setTargetPath(route.path);
      setRoutePickerOpen(false);
      setFeedback("");
    }
  };

  const handleRouteEndpointChange = (endpoint: UiEndpoint) => {
    setRoutePickerEndpoint(endpoint);
    setSelectedRoute(routeTrees[endpoint]);
  };

  const selectPanel = (nextPanelId: string) => {
    setPanelId(nextPanelId);
    setFeedback("");
  };

  const handleSave = () => {
    if (!pageConfig || !selectedButton) {
      return;
    }

    const nextAction: ComponentAction =
      actionMode === "navigate"
        ? {
            type: "navigate",
            targetPageId: targetPageId.trim() || pageConfig.id,
            targetPath: targetPath.trim() || pageConfig.path,
          }
        : {
            type: "openPanel",
            panelId: panelId.trim(),
          };

    if (nextAction.type === "openPanel" && !nextAction.panelId) {
      setFeedback("请选择要导出的小面板。");
      return;
    }

    const nextPageConfig: PageConfig = {
      ...pageConfig,
      components: pageConfig.components.map((component) =>
        component.id === selectedButton.id && component.type === "button"
          ? {
              ...component,
              action: nextAction,
            }
          : component,
      ),
    };

    const savedConfig = savePageConfig(nextPageConfig);
    setPageConfig(savedConfig);
    setFeedback("按钮配置已保存。");
  };

  return {
    pageConfig,
    selectedButton,
    actionMode,
    targetPath,
    targetPageId,
    panelId,
    routePickerOpen,
    routePickerEndpoint,
    selectedRoute,
    feedback,
    availablePanels,
    selectedPanel,
    selectedPanelChildren,
    routePickerTree,
    setTargetPath,
    setTargetPageId,
    setRoutePickerOpen,
    handleActionModeChange,
    handleSelectRoute,
    handleRouteEndpointChange,
    selectPanel,
    handleSave,
  };
};
