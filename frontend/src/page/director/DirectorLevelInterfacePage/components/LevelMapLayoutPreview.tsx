import { useCallback, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { SharedLevelMapRenderer } from "../../../shared/components/ui-renderer/SharedLevelMapRenderer.js";
import {
  moveComponentPosition,
  resizeComponentPosition,
  type ComponentResizeHandle,
} from "../../../shared/function/ui-design/component-position-adjust.js";
import {
  getLevelSuffixFromNodeButton,
  isLevelNodeButtonComponent,
} from "../../../shared/function/level-map/level-node-button-format.js";
import type { LevelMapLayoutEditContext, LevelMapPathEditContext } from "../../../shared/components/ui-renderer/ui-renderer-types.js";
import type { ComponentPosition, PageConfig, UiPreviewUser } from "../../../../objects/ui-customization/ui-customization-objects.js";

type LevelMapLayoutPreviewProps = {
  page: PageConfig;
  previewUser: UiPreviewUser;
  previewUiData: Record<string, unknown>;
  selectedLevelSuffix: string | null;
  onSelectedLevelSuffixChange: (suffix: string | null) => void;
  onLevelButtonPositionChange: (levelSuffix: string, position: ComponentPosition) => void;
  pathEdit?: LevelMapPathEditContext | undefined;
};

type LayoutAdjustSession = {
  mode: "move" | "resize";
  levelSuffix: string;
  handle?: ComponentResizeHandle;
  pointerId: number;
  startX: number;
  startY: number;
  startPosition: ComponentPosition;
  parentWidth: number;
  parentHeight: number;
  lockAspectRatio?: number;
};

export const LevelMapLayoutPreview = ({
  page,
  previewUser,
  previewUiData,
  selectedLevelSuffix,
  onSelectedLevelSuffixChange,
  onLevelButtonPositionChange,
  pathEdit,
}: LevelMapLayoutPreviewProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const adjustRef = useRef<LayoutAdjustSession | null>(null);

  const levelButtons = useMemo(
    () => page.components.filter(isLevelNodeButtonComponent),
    [page.components],
  );

  const resolveCanvasMetrics = useCallback(() => {
    const canvas = rootRef.current?.querySelector<HTMLElement>(
      ".dynamic-ui-panel.kind-stage .dynamic-ui-panel-content-canvas",
    );
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      canvas,
      width: rect.width,
      height: rect.height,
    };
  }, []);

  const beginAdjust = useCallback((
    levelSuffix: string,
    event: ReactPointerEvent<HTMLElement>,
    mode: "move" | "resize",
    handle?: ComponentResizeHandle,
  ) => {
    if (event.button !== 0) {
      return;
    }

    const button = levelButtons.find((candidate) => getLevelSuffixFromNodeButton(candidate) === levelSuffix);
    const metrics = resolveCanvasMetrics();
    if (!button || !metrics || button.type !== "button") {
      return;
    }

    event.preventDefault();
    onSelectedLevelSuffixChange(levelSuffix);
    metrics.canvas.setPointerCapture(event.pointerId);

    adjustRef.current = {
      mode,
      levelSuffix,
      ...(handle ? { handle } : {}),
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: button.position,
      parentWidth: metrics.width,
      parentHeight: metrics.height,
      ...(typeof button.style?.lockAspectRatio === "number"
        ? { lockAspectRatio: button.style.lockAspectRatio }
        : {}),
    };
  }, [levelButtons, onSelectedLevelSuffixChange, resolveCanvasMetrics]);

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const adjust = adjustRef.current;
      if (!adjust || adjust.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      const deltaX = event.clientX - adjust.startX;
      const deltaY = event.clientY - adjust.startY;
      const nextPosition = adjust.mode === "move"
        ? moveComponentPosition(
            adjust.startPosition,
            deltaX,
            deltaY,
            adjust.parentWidth,
            adjust.parentHeight,
          )
        : resizeComponentPosition(
            adjust.startPosition,
            adjust.handle ?? "bottom-right",
            deltaX,
            deltaY,
            adjust.parentWidth,
            adjust.parentHeight,
            typeof adjust.lockAspectRatio === "number"
              ? { lockAspectRatio: adjust.lockAspectRatio }
              : undefined,
          );

      onLevelButtonPositionChange(adjust.levelSuffix, nextPosition);
    };

    const handlePointerUp = (event: globalThis.PointerEvent) => {
      const adjust = adjustRef.current;
      if (adjust?.pointerId === event.pointerId) {
        adjustRef.current = null;
        const canvas = rootRef.current?.querySelector<HTMLElement>(
          ".dynamic-ui-panel.kind-stage .dynamic-ui-panel-content-canvas",
        );
        if (canvas?.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [onLevelButtonPositionChange]);

  const layoutEdit = useMemo((): LevelMapLayoutEditContext => ({
    enabled: true,
    selectedLevelSuffix,
    onSelect: onSelectedLevelSuffixChange,
    onBeginMove: (levelSuffix, event) => beginAdjust(levelSuffix, event, "move"),
    onBeginResize: (levelSuffix, handle, event) => beginAdjust(levelSuffix, event, "resize", handle),
  }), [beginAdjust, onSelectedLevelSuffixChange, selectedLevelSuffix]);

  return (
    <SharedLevelMapRenderer
      rootRef={rootRef}
      page={page}
      previewUser={previewUser}
      previewUiData={previewUiData}
      onNavigate={() => {}}
      editing
      {...(pathEdit
        ? { levelMapPathEdit: pathEdit }
        : { levelMapLayoutEdit: layoutEdit })}
    />
  );
};
