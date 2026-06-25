import { useEffect, useMemo, useRef, type PointerEvent } from "react";
import {
  getPanelTextArtContainerStyle,
  getPanelTextArtContentClassName,
  getPanelTextArtContentStyle,
  isArtTextPreset,
  resolveTextArtDesign,
} from "../../../../lib/art-text-styles.js";
import { resolveTextComponentContent } from "../../../../lib/dynamic-text-program.js";
import {
  getButtonBaseDesignStyle,
  getButtonImageDesignStyle,
  getButtonTextScaleStyle,
  getComponentStyle,
  getPositionStyle,
  getRootComponents,
} from "../../../../components/ui-renderer/ui-renderer-utils.js";
import { useDragScroll } from "../hooks/useDragScroll.js";
import {
  createComponentMap,
  getButtonControlledPanelId,
  getLogicalPanelChildren,
  getPanelControlledChildren,
  getSelectedMoveTarget,
  getSelectedResizeTarget,
  hitTestOutlinedComponent,
} from "../function/page-builder-helpers.js";
import {
  CLICK_DRAG_THRESHOLD_PX,
  type OutlineSelectionState,
  type PageBuilderComponentNodeProps,
  type PageBuilderPreviewProps,
  type PageBuilderTextNodeProps,
  type PointerGestureState,
} from "../objects/page-builder-types.js";

const PageBuilderOutline = ({
  componentId,
  selectionState,
}: {
  componentId: string;
  selectionState: OutlineSelectionState;
}) => (
  <div
    className={`page-builder-node-outline state-${selectionState}`}
    data-page-builder-outline-id={componentId}
    contentEditable={false}
    aria-hidden="true"
  >
    <span className="page-builder-corner top-left" data-page-builder-resize-handle="top-left" />
    <span className="page-builder-corner top-right" data-page-builder-resize-handle="top-right" />
    <span className="page-builder-corner bottom-left" data-page-builder-resize-handle="bottom-left" />
    <span className="page-builder-corner bottom-right" data-page-builder-resize-handle="bottom-right" />
  </div>
);

const PageBuilderTextNode = ({
  component,
  previewUser,
  showOutline,
  selectionState,
  isSelected,
  isEditing,
  onTextChange,
  onTextEditEnd,
}: PageBuilderTextNodeProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const wasEditingRef = useRef(false);
  const artTextDesign = component.artTextDesign;
  const usesArtText = isArtTextPreset(resolveTextArtDesign(artTextDesign).preset);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (isEditing && !wasEditingRef.current) {
      editor.textContent = component.text;
      window.requestAnimationFrame(() => {
        editor.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
    }

    if (!isEditing && wasEditingRef.current) {
      onTextChange(component.id, editor.textContent ?? "");
    }

    wasEditingRef.current = isEditing;
  }, [component.id, component.text, isEditing, onTextChange]);

  return (
    <div
      className={`page-builder-preview-node page-builder-preview-text ${isEditing ? "editing" : ""} ${usesArtText ? "is-art-text" : ""}`.trim()}
      data-page-builder-component-id={component.id}
      data-page-builder-selected={isSelected ? "true" : undefined}
      style={{
        ...getPositionStyle(component.position),
        ...getComponentStyle(component.style),
        ...(usesArtText ? getPanelTextArtContainerStyle(artTextDesign) : {}),
      }}
    >
      <div
        ref={editorRef}
        className={`page-builder-preview-text-content ${usesArtText && !isEditing ? getPanelTextArtContentClassName(artTextDesign) : ""}`.trim()}
        data-page-builder-text-editing={isEditing ? "true" : undefined}
        contentEditable={isEditing}
        suppressContentEditableWarning={isEditing}
        style={usesArtText && !isEditing ? getPanelTextArtContentStyle(artTextDesign) : undefined}
        onBlur={(event) => {
          if (isEditing) {
            onTextChange(component.id, event.currentTarget.textContent ?? "");
            onTextEditEnd();
          }
        }}
      >
        {isEditing ? null : resolveTextComponentContent(component, previewUser)}
      </div>
      {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
    </div>
  );
};

const PageBuilderComponentNode = ({
  component,
  componentMap,
  controlledPanelIds,
  openPanelIds,
  previewUser,
  outlinedComponentIds,
  pendingComponentId,
  selectedComponentId,
  editingTextComponentId,
  onTogglePanel,
  onResizeSelectedComponent,
  onTextChange,
  onTextEditEnd,
  visitedComponentIds = new Set<string>(),
}: PageBuilderComponentNodeProps) => {
  if (visitedComponentIds.has(component.id)) {
    return null;
  }

  const nextVisitedComponentIds = new Set(visitedComponentIds);
  nextVisitedComponentIds.add(component.id);
  const showOutline = outlinedComponentIds.has(component.id);
  const isSelected = component.id === selectedComponentId;
  const selectionState: OutlineSelectionState =
    isSelected
      ? "selected"
      : component.id === pendingComponentId
        ? "pending"
        : "idle";

  if (component.type === "button") {
    const controlledPanelId = getButtonControlledPanelId(component);
    const isActivePanelTrigger = Boolean(controlledPanelId && openPanelIds.has(controlledPanelId));
    const shouldShowContent = !component.imageDesign?.outputDataUrl;

    return (
      <button
        type="button"
        className={`page-builder-preview-node page-builder-preview-button ${component.style?.variant ?? "primary"} ${isActivePanelTrigger ? "active-panel-trigger" : ""}`}
        data-page-builder-component-id={component.id}
        data-page-builder-selected={isSelected ? "true" : undefined}
        style={{
          ...getPositionStyle(component.position),
          ...getComponentStyle(component.style),
          ...getButtonTextScaleStyle(component.position, component.style),
          ...(component.baseDesign ? { backgroundColor: "#ffffff", borderColor: "transparent", borderRadius: 0, padding: 0 } : {}),
        }}
        tabIndex={-1}
        onClick={() => {
          if (isSelected) {
            return;
          }
          if (controlledPanelId) {
            onTogglePanel(controlledPanelId);
          }
        }}
      >
        {component.baseDesign ? (
          <span
            className="dynamic-ui-button-base"
            style={getButtonBaseDesignStyle(component.baseDesign)}
            aria-hidden="true"
          >
            {component.baseDesign.scalingMode === "fixedAspect" ? <img src={component.baseDesign.sourceDataUrl} alt="" /> : null}
          </span>
        ) : null}
        {component.imageDesign ? (
          <span
            className="dynamic-ui-button-image"
            style={getButtonImageDesignStyle(component.imageDesign)}
            aria-hidden="true"
          />
        ) : null}
        {shouldShowContent ? (
          <span className="dynamic-ui-button-content">
            {component.icon ? <span className="dynamic-ui-button-icon">{component.icon}</span> : null}
            <span>{component.label}</span>
          </span>
        ) : null}
        {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      </button>
    );
  }

  if (component.type === "text") {
    const isEditing = component.id === editingTextComponentId;
    return (
      <PageBuilderTextNode
        component={component}
        previewUser={previewUser}
        showOutline={showOutline}
        selectionState={selectionState}
        isSelected={isSelected}
        isEditing={isEditing}
        onTextChange={onTextChange}
        onTextEditEnd={onTextEditEnd}
      />
    );
  }

  if (component.type === "list") {
    return (
      <div
        className="page-builder-preview-node page-builder-preview-text"
        data-page-builder-component-id={component.id}
        data-page-builder-selected={isSelected ? "true" : undefined}
        style={{
          ...getPositionStyle(component.position),
          ...getComponentStyle(component.style),
        }}
      >
        <div className="page-builder-preview-text-content">
          {component.emptyStateText ?? `列表：${component.dataPath}`}
        </div>
        {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      </div>
    );
  }

  if (component.type === "widget") {
    return (
      <div
        className="page-builder-preview-node page-builder-preview-text"
        data-page-builder-component-id={component.id}
        data-page-builder-selected={isSelected ? "true" : undefined}
        style={{
          ...getPositionStyle(component.position),
          ...getComponentStyle(component.style),
        }}
      >
        <div className="page-builder-preview-text-content">
          {component.widgetId === "adminProposalReview"
            ? "提案审核功能组件"
            : component.widgetId === "levelMapStage"
              ? "关卡路径地图组件"
              : component.widgetId}
        </div>
        {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      </div>
    );
  }

  if (component.type !== "panel") {
    return null;
  }

  const contentSize = component.contentSize;
  const { scrollContainerRef, dragScrollHandlers } = useDragScroll(Boolean(contentSize));
  const childComponents = [
    ...getLogicalPanelChildren(component, componentMap, controlledPanelIds),
    ...getPanelControlledChildren(component, componentMap).filter((child) => openPanelIds.has(child.id)),
  ];

  return (
    <section
      className={`page-builder-preview-node page-builder-preview-panel kind-${component.kind ?? "container"} ${controlledPanelIds.has(component.id) ? "controlled-panel" : ""}`}
      data-page-builder-component-id={component.id}
      data-page-builder-selected={isSelected ? "true" : undefined}
      style={{
        ...getPositionStyle(component.position),
        ...getComponentStyle(component.style),
      }}
    >
      {showOutline ? <PageBuilderOutline componentId={component.id} selectionState={selectionState} /> : null}
      <div
        ref={scrollContainerRef}
        className={`page-builder-preview-panel-content ${contentSize ? "scrollable draggable" : ""}`}
        {...dragScrollHandlers}
      >
        <div
          className="page-builder-preview-panel-canvas"
          style={
            contentSize
              ? {
                  width: `${contentSize.widthPercent}%`,
                  height: `${contentSize.heightPercent}%`,
                }
              : undefined
          }
        >
          {childComponents.map((child) => (
            <PageBuilderComponentNode
              key={child.id}
              component={child}
              componentMap={componentMap}
              controlledPanelIds={controlledPanelIds}
              openPanelIds={openPanelIds}
              previewUser={previewUser}
              outlinedComponentIds={outlinedComponentIds}
              pendingComponentId={pendingComponentId}
              selectedComponentId={selectedComponentId}
              editingTextComponentId={editingTextComponentId}
              onTogglePanel={onTogglePanel}
              onResizeSelectedComponent={onResizeSelectedComponent}
              onTextChange={onTextChange}
              onTextEditEnd={onTextEditEnd}
              visitedComponentIds={nextVisitedComponentIds}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export const PageBuilderPreview = ({
  pageConfig,
  controlledPanelIds,
  openPanelIds,
  previewUser,
  outlinedComponentIds,
  pendingComponentId,
  selectedComponentId,
  editingTextComponentId,
  onTogglePanel,
  onOutlineClick,
  onOutlineMiss,
  onStartTextEditing,
  onMoveSelectedComponent,
  onResizeSelectedComponent,
  onTextChange,
  onTextEditEnd,
}: PageBuilderPreviewProps) => {
  const pointerStartRef = useRef<PointerGestureState | null>(null);
  const componentMap = useMemo(() => createComponentMap(pageConfig.components), [pageConfig.components]);
  const rootComponents = useMemo(
    () => getRootComponents(pageConfig.components),
    [pageConfig.components],
  );

  const handlePreviewPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('[data-page-builder-text-editing="true"]')) {
      pointerStartRef.current = null;
      return;
    }

    const selectedResizeTarget = getSelectedResizeTarget(
      event.currentTarget,
      { x: event.clientX, y: event.clientY },
      selectedComponentId,
    );
    if (selectedResizeTarget) {
      event.preventDefault();
      pointerStartRef.current = {
        mode: "resize-selected",
        componentId: selectedResizeTarget.componentId,
        handle: selectedResizeTarget.handle,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        pointerId: event.pointerId,
        parentWidth: selectedResizeTarget.parentWidth,
        parentHeight: selectedResizeTarget.parentHeight,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const selectedMoveTarget = getSelectedMoveTarget(
      event.currentTarget,
      { x: event.clientX, y: event.clientY },
      selectedComponentId,
    );
    if (selectedMoveTarget) {
      event.preventDefault();
      const selectedComponent = componentMap.get(selectedMoveTarget.componentId);
      pointerStartRef.current = {
        mode: selectedComponent?.type === "text" ? "selected-text" : "move-selected",
        componentId: selectedMoveTarget.componentId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        pointerId: event.pointerId,
        parentWidth: selectedMoveTarget.parentWidth,
        parentHeight: selectedMoveTarget.parentHeight,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    pointerStartRef.current = {
      mode: "click",
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
  };

  const handlePreviewPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointerStart = pointerStartRef.current;
    if (
      !pointerStart ||
      (pointerStart.mode !== "move-selected" &&
        pointerStart.mode !== "resize-selected" &&
        pointerStart.mode !== "selected-text") ||
      pointerStart.pointerId !== event.pointerId
    ) {
      return;
    }

    const deltaX = event.clientX - pointerStart.lastX;
    const deltaY = event.clientY - pointerStart.lastY;
    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    event.preventDefault();

    if (pointerStart.mode === "selected-text") {
      const totalDistance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      if (totalDistance <= CLICK_DRAG_THRESHOLD_PX) {
        return;
      }

      onMoveSelectedComponent(
        pointerStart.componentId,
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
      pointerStartRef.current = {
        ...pointerStart,
        mode: "move-selected",
        lastX: event.clientX,
        lastY: event.clientY,
      };
      return;
    }

    if (pointerStart.mode === "move-selected") {
      onMoveSelectedComponent(
        pointerStart.componentId,
        deltaX,
        deltaY,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
    } else {
      onResizeSelectedComponent(
        pointerStart.componentId,
        pointerStart.handle,
        deltaX,
        deltaY,
        pointerStart.parentWidth,
        pointerStart.parentHeight,
      );
    }
    pointerStartRef.current = {
      ...pointerStart,
      lastX: event.clientX,
      lastY: event.clientY,
    };
  };

  const handlePreviewPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const pointerStart = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pointerStart.mode === "move-selected" || pointerStart.mode === "resize-selected") {
      return;
    }

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    const dragDistance = Math.hypot(deltaX, deltaY);
    if (dragDistance > CLICK_DRAG_THRESHOLD_PX) {
      return;
    }
    if (pointerStart.mode === "selected-text") {
      onStartTextEditing(pointerStart.componentId);
      return;
    }

    const hitComponentId = hitTestOutlinedComponent(
      event.currentTarget,
      { x: event.clientX, y: event.clientY },
      outlinedComponentIds,
    );
    if (hitComponentId) {
      onOutlineClick(hitComponentId);
    } else {
      onOutlineMiss();
    }
  };

  return (
    <div
      className={`page-builder-preview-page layout-${pageConfig.layout.type}`}
      onPointerDown={handlePreviewPointerDown}
      onPointerMove={handlePreviewPointerMove}
      onPointerUp={handlePreviewPointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
    >
      {rootComponents.map((component) => (
        <PageBuilderComponentNode
          key={component.id}
          component={component}
          componentMap={componentMap}
          controlledPanelIds={controlledPanelIds}
          openPanelIds={openPanelIds}
          previewUser={previewUser}
          outlinedComponentIds={outlinedComponentIds}
          pendingComponentId={pendingComponentId}
          selectedComponentId={selectedComponentId}
          editingTextComponentId={editingTextComponentId}
          onTogglePanel={onTogglePanel}
          onResizeSelectedComponent={onResizeSelectedComponent}
          onTextChange={onTextChange}
          onTextEditEnd={onTextEditEnd}
        />
      ))}
    </div>
  );
};
