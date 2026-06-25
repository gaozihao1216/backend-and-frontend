import { useMemo, useState } from "react";
import { getTextContentMode } from "../../../shared/function/ui-design/dynamic-text-program.js";
import { getPageConfig, savePageConfig } from "../../../shared/function/ui-config/ui-customization.js";
import { publishUiPageConfig, rollbackUiPageConfig } from "../../../shared/function/ui-config/ui-page-publish.js";
import {
  canUseAsWorkingPanel,
  createChildComponentId,
  createComponentMap,
  createControlledPanelIds,
  createDefaultComponentName,
  getLogicalPanelChildren,
  getParentPanelId,
  isPanelComponent,
} from "../function/page-builder-helpers.js";
import type { ResizeHandle } from "../objects/page-builder-types.js";
import type { PageComponent, PageConfig, PanelComponent, TextComponent } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { getUiPreviewUser } from "../../../../objects/ui-customization/ui-customization-objects.js";

type UseDirectorPageBuilderOptions = {
  pageId: string | null;
  targetPath: string;
  onNavigate: (nextPath: string) => void;
  userId?: string | null;
};

/**
 * director 页面构建器 view model。
 *
 * 负责编辑 PageConfig 的组件树：选择工作面板、增删子组件、拖拽移动/缩放、
 * 文本编辑、发布/回滚，以及静态/动态/对比预览模式。
 */
export const useDirectorPageBuilder = ({ pageId, targetPath, onNavigate, userId = null }: UseDirectorPageBuilderOptions) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => pageId ? getPageConfig(pageId) : null);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);
  const [pickerPanelId, setPickerPanelId] = useState<string | null>(null);
  const [showPanelOutlines, setShowPanelOutlines] = useState(true);
  const [showButtonOutlines, setShowButtonOutlines] = useState(true);
  const [showTextOutlines, setShowTextOutlines] = useState(true);
  const [openPanelIds, setOpenPanelIds] = useState<Set<string>>(() => new Set());
  const [pendingComponentId, setPendingComponentId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [editingTextComponentId, setEditingTextComponentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [publishState, setPublishState] = useState<"idle" | "working">("idle");
  const [builderSurfaceMode, setBuilderSurfaceMode] = useState<"editor" | "static" | "dynamic" | "compare">("editor");
  const previewUser = pageConfig ? getUiPreviewUser(pageConfig.roleScope) : null;
  const componentMap = useMemo(
    () => pageConfig ? createComponentMap(pageConfig.components) : new Map<string, PageComponent>(),
    [pageConfig],
  );
  const controlledPanelIds = useMemo(
    () => pageConfig ? createControlledPanelIds(pageConfig.components) : new Set<string>(),
    [pageConfig],
  );
  const rootPanel = useMemo(
    () => pageConfig?.components.find(canUseAsWorkingPanel) ?? null,
    [pageConfig],
  );
  const [workingPanelId, setWorkingPanelId] = useState<string | null>(() =>
    pageConfig?.components.find(canUseAsWorkingPanel)?.id ?? null,
  );
  const workingPanel = workingPanelId ? componentMap.get(workingPanelId) : rootPanel;
  const normalizedWorkingPanel = workingPanel && canUseAsWorkingPanel(workingPanel) ? workingPanel : rootPanel;
  const activePickerPanel = pickerPanelId
    ? componentMap.get(pickerPanelId)
    : normalizedWorkingPanel;
  const normalizedPickerPanel = activePickerPanel && isPanelComponent(activePickerPanel)
    ? activePickerPanel
    : normalizedWorkingPanel;
  const outlinedComponentIds = useMemo(() => {
    if (!normalizedWorkingPanel) {
      return new Set<string>();
    }

    const nextOutlinedComponentIds = new Set<string>();
    getLogicalPanelChildren(normalizedWorkingPanel, componentMap, controlledPanelIds).forEach((child) => {
      if (child.type === "panel" && showPanelOutlines) {
        nextOutlinedComponentIds.add(child.id);
      }
      if (child.type === "button" && showButtonOutlines) {
        nextOutlinedComponentIds.add(child.id);
      }
      if (child.type === "text" && showTextOutlines) {
        nextOutlinedComponentIds.add(child.id);
      }
    });
    return nextOutlinedComponentIds;
  }, [componentMap, controlledPanelIds, normalizedWorkingPanel, showButtonOutlines, showPanelOutlines, showTextOutlines]);
  const normalizedPendingComponentId =
    pendingComponentId && outlinedComponentIds.has(pendingComponentId) ? pendingComponentId : null;
  const normalizedSelectedComponentId =
    selectedComponentId && outlinedComponentIds.has(selectedComponentId) ? selectedComponentId : null;
  const selectedComponent = normalizedSelectedComponentId
    ? componentMap.get(normalizedSelectedComponentId) ?? null
    : null;
  const activeComponent = selectedComponent
    ?? (normalizedPendingComponentId ? componentMap.get(normalizedPendingComponentId) ?? null : null);
  // 所有本地草稿变更都走这一层，统一清空旧反馈并保持 React 状态不可变。
  const updatePageConfig = (updater: (current: PageConfig) => PageConfig) => {
    setPageConfig((current) => current ? updater(current) : current);
    setFeedback("");
  };

  const addComponentToWorkingPanel = (type: "button" | "panel" | "text") => {
    if (!normalizedWorkingPanel) {
      return;
    }

    updatePageConfig((current) => {
      const currentWorkingPanel = current.components.find(
        (component): component is PanelComponent =>
          component.id === normalizedWorkingPanel.id && canUseAsWorkingPanel(component),
      );
      if (!currentWorkingPanel) {
        return current;
      }

      const componentId = createChildComponentId(current, currentWorkingPanel);
      const defaultName = createDefaultComponentName(current, currentWorkingPanel, type);
      const newComponent: PageComponent =
        type === "button"
          ? {
              id: componentId,
              type: "button",
              label: defaultName,
              icon: "plus",
              position: { unit: "percent", x: 8, y: 8, width: 18, height: 8 },
              style: { variant: "secondary", borderRadius: 10 },
              action: { type: "none" },
            }
          : type === "panel"
            ? {
                id: componentId,
                type: "panel",
                kind: "group",
                title: defaultName,
                position: { unit: "percent", x: 10, y: 12, width: 34, height: 26 },
                style: { backgroundColor: "#fffdfa", borderRadius: 12 },
                childComponentIds: [],
              }
            : {
                id: componentId,
                type: "text",
                text: defaultName,
                textContentMode: "fixed",
                artTextDesign: { preset: "goldGradient" },
                position: { unit: "percent", x: 8, y: 8, width: 28, height: 8 },
                style: { backgroundColor: "#ffffff", textColor: "#12202f", borderRadius: 10 },
              };

      return {
        ...current,
        components: current.components
          .map((component) =>
            component.id === currentWorkingPanel.id && component.type === "panel"
              ? {
                  ...component,
                  childComponentIds: [...component.childComponentIds, componentId],
                }
              : component,
          )
          .concat(newComponent),
      };
    });
  };

  const deleteWorkingPanel = () => {
    if (!pageConfig || !normalizedWorkingPanel || normalizedWorkingPanel.id === rootPanel?.id) {
      return;
    }

    const removedIds = new Set<string>();
    const collectDescendants = (componentId: string) => {
      removedIds.add(componentId);
      const component = componentMap.get(componentId);
      if (component?.type === "panel") {
        component.childComponentIds.forEach(collectDescendants);
      }
    };
    collectDescendants(normalizedWorkingPanel.id);
    const parentPanelId = getParentPanelId(pageConfig, normalizedWorkingPanel.id);

    updatePageConfig((current) => ({
      ...current,
      components: current.components
        .filter((component) => !removedIds.has(component.id))
        .map((component) =>
          component.type === "panel"
            ? {
                ...component,
                childComponentIds: component.childComponentIds.filter((childId) => !removedIds.has(childId)),
              }
            : component,
        ),
    }));
    setWorkingPanelId(parentPanelId ?? rootPanel?.id ?? null);
    setPickerPanelId(parentPanelId ?? rootPanel?.id ?? null);
  };

  const handleSave = () => {
    if (!pageConfig) {
      return;
    }

    savePageConfig(pageConfig);
    setFeedback("配置已保存到本地草稿。");
  };

  const handlePublish = async () => {
    if (!pageConfig || !pageId) {
      return;
    }

    if (!userId) {
      setFeedback("请先绑定总监后端账号后再发布。");
      return;
    }

    setPublishState("working");
    try {
      const publishedPage = await publishUiPageConfig(userId, pageConfig);
      setPageConfig(publishedPage);
      setFeedback("配置已发布，玩家将读取服务端版本。");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "发布到服务端失败。");
    } finally {
      setPublishState("idle");
    }
  };

  const handleRollback = async () => {
    if (!pageId) {
      return;
    }

    if (!userId) {
      setFeedback("请先绑定总监后端账号后再回滚。");
      return;
    }

    setPublishState("working");
    try {
      const restoredPage = await rollbackUiPageConfig(userId, pageId);
      setPageConfig(restoredPage);
      setFeedback("已回滚到上一版发布配置。");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "没有可回滚的发布版本。");
    } finally {
      setPublishState("idle");
    }
  };
  const openButtonDesign = () => {
    if (!pageId || activeComponent?.type !== "button") {
      return;
    }

    const designBasePath = targetPath === "/" ? "" : targetPath;
    onNavigate(
      `${designBasePath}/button_design?pageId=${encodeURIComponent(pageId)}&componentId=${encodeURIComponent(activeComponent.id)}`,
    );
  };
  const openButtonConfig = () => {
    if (!pageId || activeComponent?.type !== "button") {
      return;
    }

    const designBasePath = targetPath === "/" ? "" : targetPath;
    onNavigate(
      `${designBasePath}/button_config?pageId=${encodeURIComponent(pageId)}&componentId=${encodeURIComponent(activeComponent.id)}`,
    );
  };
  const openPanelCreate = () => {
    if (!pageId) {
      return;
    }

    const designBasePath = targetPath === "/" ? "" : targetPath;
    const parentPanelQuery = normalizedWorkingPanel
      ? `&parentPanelId=${encodeURIComponent(normalizedWorkingPanel.id)}`
      : "";
    onNavigate(
      `${designBasePath}/panel_create?pageId=${encodeURIComponent(pageId)}${parentPanelQuery}`,
    );
  };
  const setActivePanelAsWorkingPanel = () => {
    if (!canUseAsWorkingPanel(activeComponent)) {
      return;
    }

    setWorkingPanelId(activeComponent.id);
    setPickerPanelId(activeComponent.id);
    setPendingComponentId(null);
    setSelectedComponentId(null);
    setEditingTextComponentId(null);
  };
  const togglePreviewPanel = (panelId: string) => {
    setOpenPanelIds((current) => {
      const next = new Set(current);
      if (next.has(panelId)) {
        next.delete(panelId);
      } else {
        next.add(panelId);
      }
      return next;
    });
  };
  const selectPreviewObject = (componentId: string) => {
    if (!outlinedComponentIds.has(componentId)) {
      return;
    }

    setEditingTextComponentId(null);
    if (normalizedPendingComponentId === componentId) {
      setSelectedComponentId(componentId);
      setPendingComponentId(null);
      return;
    }

    if (normalizedSelectedComponentId === componentId) {
      return;
    }

    setPendingComponentId(componentId);
    setSelectedComponentId(null);
  };
  const clearPreviewObjectSelection = () => {
    setPendingComponentId(null);
    setSelectedComponentId(null);
    setEditingTextComponentId(null);
  };
  const startTextEditing = (componentId: string) => {
    const component = componentMap.get(componentId);
    if (
      component?.type !== "text"
      || normalizedSelectedComponentId !== componentId
      || getTextContentMode(component.textContentMode) === "dynamic"
    ) {
      return;
    }

    setEditingTextComponentId(componentId);
  };
  const updateTextComponent = (componentId: string, updater: (component: TextComponent) => TextComponent) => {
    updatePageConfig((current) => ({
      ...current,
      components: current.components.map((component) =>
        component.id === componentId && component.type === "text"
          ? updater(component)
          : component,
      ),
    }));
  };
  const updateTextComponentContent = (componentId: string, text: string) => {
    updateTextComponent(componentId, (component) => ({ ...component, text }));
  };
  const endTextEditing = () => {
    setEditingTextComponentId(null);
  };
  const moveSelectedPreviewObject = (
    componentId: string,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => {
    if (!normalizedSelectedComponentId || normalizedSelectedComponentId !== componentId) {
      return;
    }
    setEditingTextComponentId(null);

    updatePageConfig((current) => ({
      ...current,
      components: current.components.map((component) => {
        if (component.id !== componentId) {
          return component;
        }

        const nextX = component.position.unit === "px"
          ? component.position.x + deltaX
          : component.position.x + (deltaX / parentWidth) * 100;
        const nextY = component.position.unit === "px"
          ? component.position.y + deltaY
          : component.position.y + (deltaY / parentHeight) * 100;

        return {
          ...component,
          position: {
            ...component.position,
            x: Math.max(0, nextX),
            y: Math.max(0, nextY),
          },
        };
      }),
    }));
  };
  const resizeSelectedPreviewObject = (
    componentId: string,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    parentWidth: number,
    parentHeight: number,
  ) => {
    if (!normalizedSelectedComponentId || normalizedSelectedComponentId !== componentId) {
      return;
    }
    setEditingTextComponentId(null);

    updatePageConfig((current) => ({
      ...current,
      components: current.components.map((component) => {
        if (component.id !== componentId) {
          return component;
        }

        const position = component.position;
        const deltaUnitX = position.unit === "px" ? deltaX : (deltaX / parentWidth) * 100;
        const deltaUnitY = position.unit === "px" ? deltaY : (deltaY / parentHeight) * 100;
        const minWidth = position.unit === "px" ? 24 : 2;
        const minHeight = position.unit === "px" ? 18 : 2;
        const isLeftHandle = handle === "top-left" || handle === "bottom-left";
        const isTopHandle = handle === "top-left" || handle === "top-right";

        let nextX = position.x;
        let nextY = position.y;
        let nextWidth = position.width;
        let nextHeight = position.height;

        if (isLeftHandle) {
          const effectiveDeltaX = Math.min(deltaUnitX, position.width - minWidth);
          nextX = Math.max(0, position.x + effectiveDeltaX);
          nextWidth = Math.max(minWidth, position.width - effectiveDeltaX);
        } else {
          nextWidth = Math.max(minWidth, position.width + deltaUnitX);
        }

        if (isTopHandle) {
          const effectiveDeltaY = Math.min(deltaUnitY, position.height - minHeight);
          nextY = Math.max(0, position.y + effectiveDeltaY);
          nextHeight = Math.max(minHeight, position.height - effectiveDeltaY);
        } else {
          nextHeight = Math.max(minHeight, position.height + deltaUnitY);
        }

        const lockedAspectRatio = component.type === "button" ? component.style?.lockAspectRatio : undefined;
        if (typeof lockedAspectRatio === "number") {
          if (Math.abs(deltaUnitX) >= Math.abs(deltaUnitY)) {
            const adjustedHeight = Math.max(minHeight, nextWidth / lockedAspectRatio);
            if (isTopHandle) {
              nextY = Math.max(0, position.y + position.height - adjustedHeight);
            }
            nextHeight = adjustedHeight;
          } else {
            const adjustedWidth = Math.max(minWidth, nextHeight * lockedAspectRatio);
            if (isLeftHandle) {
              nextX = Math.max(0, position.x + position.width - adjustedWidth);
            }
            nextWidth = adjustedWidth;
          }
        }

        return {
          ...component,
          position: {
            ...position,
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight,
          },
        };
      }),
    }));
  };

  return {
    pageId,
    targetPath,
    pageConfig,
    panelPickerOpen,
    setPanelPickerOpen,
    pickerPanelId,
    setPickerPanelId,
    showPanelOutlines,
    setShowPanelOutlines,
    showButtonOutlines,
    setShowButtonOutlines,
    showTextOutlines,
    setShowTextOutlines,
    openPanelIds,
    editingTextComponentId,
    feedback,
    builderSurfaceMode,
    setBuilderSurfaceMode,
    previewUser,
    componentMap,
    controlledPanelIds,
    rootPanel,
    normalizedWorkingPanel,
    normalizedPickerPanel,
    outlinedComponentIds,
    normalizedPendingComponentId,
    normalizedSelectedComponentId,
    activeComponent,
    addComponentToWorkingPanel,
    deleteWorkingPanel,
    handleSave,
    handlePublish,
    handleRollback,
    publishState,
    openButtonDesign,
    openButtonConfig,
    openPanelCreate,
    setActivePanelAsWorkingPanel,
    togglePreviewPanel,
    selectPreviewObject,
    clearPreviewObjectSelection,
    startTextEditing,
    updateTextComponent,
    updateTextComponentContent,
    endTextEditing,
    moveSelectedPreviewObject,
    resizeSelectedPreviewObject,
    setWorkingPanelId,
  };
};

export type DirectorPageBuilderState = ReturnType<typeof useDirectorPageBuilder>;
