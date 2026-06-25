import { useState } from "react";
import { getPageConfig, savePageConfig } from "../../../shared/function/ui-config/ui-customization.js";
import {
  isDynamicPath,
  routeTrees,
  type SelectedRoute,
} from "../../../../objects/ui-customization/ui-route-tree.js";
import type {
  ButtonComponent,
  PageConfig,
  UiEndpoint,
} from "../../../../objects/ui-customization/ui-customization-objects.js";

const getEditablePageConfig = (pageId: string): PageConfig | null => {
  const config = getPageConfig(pageId);
  return config ? structuredClone(config) : null;
};

const isButtonComponent = (component: PageConfig["components"][number]): component is ButtonComponent =>
  component.type === "button";

export const useDirectorUiCustomizationPage = (onNavigate: (path: string) => void) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<UiEndpoint>("player");
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute>(() => routeTrees.player);
  const [editingConfig, setEditingConfig] = useState<PageConfig | null>(() => getEditablePageConfig(routeTrees.player.pageId));
  const [saveMessage, setSaveMessage] = useState("");
  const [optimizeError, setOptimizeError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  const selectedTree = routeTrees[selectedEndpoint];
  const selectedRouteIsDynamic = isDynamicPath(selectedRoute.path);
  const buttonComponents = editingConfig?.components.filter(isButtonComponent) ?? [];

  const selectRoute = (route: SelectedRoute) => {
    setSelectedRoute(route);
    setEditingConfig(getEditablePageConfig(route.pageId));
    setSaveMessage("");
    setOptimizeError("");
  };

  const handleEndpointChange = (endpoint: UiEndpoint) => {
    setSelectedEndpoint(endpoint);
    selectRoute(routeTrees[endpoint]);
  };

  const updateEditingConfig = (updater: (config: PageConfig) => PageConfig) => {
    setEditingConfig((current) => current ? updater(current) : current);
    setSaveMessage("");
  };

  const updateButtonComponent = (
    buttonId: string,
    updater: (button: ButtonComponent) => ButtonComponent,
  ) => {
    updateEditingConfig((config) => ({
      ...config,
      components: config.components.map((component) =>
        component.type === "button" && component.id === buttonId ? updater(component) : component,
      ),
    }));
  };

  const handleSaveConfig = () => {
    if (!editingConfig) {
      return;
    }

    const savedConfig = savePageConfig(editingConfig);
    setEditingConfig(structuredClone(savedConfig));
    setSaveMessage("配置已保存到本地。");
  };

  const handleOptimizeSelectedPage = () => {
    setOptimizeError("");

    if (!editingConfig) {
      setOptimizeError("该页面还没有动态页面配置，无法优化。");
      return;
    }

    if (selectedRouteIsDynamic) {
      setOptimizeError("动态模板页面需要具体页面实例后才能优化。");
      return;
    }

    const updateBasePath = selectedRoute.path === "/" ? "" : selectedRoute.path;
    onNavigate(`${updateBasePath}/update?pageId=${encodeURIComponent(selectedRoute.pageId)}`);
  };

  return {
    selectedEndpoint,
    selectedRoute,
    editingConfig,
    saveMessage,
    optimizeError,
    manualOpen,
    selectedTree,
    selectedRouteIsDynamic,
    buttonComponents,
    setManualOpen,
    selectRoute,
    handleEndpointChange,
    updateEditingConfig,
    updateButtonComponent,
    handleSaveConfig,
    handleOptimizeSelectedPage,
  };
};
