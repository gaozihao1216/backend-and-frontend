import type { RefObject } from "react";
import { findStagePanel } from "../../function/level-map/level-stage-structure.js";
import { DynamicPageRenderer } from "./DynamicPageRenderer.js";
import type {
  LevelMapLayoutEditContext,
  LevelMapPathEditContext,
} from "./ui-renderer-types.js";
import type { PageConfig, UiPreviewUser } from "../../../../objects/ui-customization/ui-customization-objects.js";

export type SharedLevelMapRendererProps = {
  page: PageConfig;
  previewUser?: UiPreviewUser | undefined;
  runtimeUserId?: string | undefined;
  previewUiData?: Record<string, unknown> | undefined;
  onNavigate: (path: string) => void;
  fitStageToHost?: boolean | undefined;
  editing?: boolean | undefined;
  rootRef?: RefObject<HTMLDivElement | null> | undefined;
  levelMapLayoutEdit?: LevelMapLayoutEditContext | undefined;
  levelMapPathEdit?: LevelMapPathEditContext | undefined;
};

const getStageDecorationKey = (page: PageConfig): string => {
  const stage = findStagePanel(page);
  return JSON.stringify(stage?.decoration ?? null);
};

/** Single read-only/edit-capable renderer for `shared.levelMap` — used by role homes and director preview. */
export const SharedLevelMapRenderer = ({
  page,
  previewUser,
  runtimeUserId,
  previewUiData,
  onNavigate,
  fitStageToHost = false,
  editing = false,
  rootRef,
  levelMapLayoutEdit,
  levelMapPathEdit,
}: SharedLevelMapRendererProps) => (
  <div
    ref={rootRef}
    className={`level-map-layout-preview${editing ? " is-editing" : ""}`.trim()}
  >
    <DynamicPageRenderer
      key={getStageDecorationKey(page)}
      page={page}
      previewUser={previewUser}
      runtimeUserId={runtimeUserId}
      previewUiData={previewUiData}
      onNavigate={onNavigate}
      {...(fitStageToHost ? { fitStageToHost: true } : {})}
      {...(levelMapPathEdit ? { levelMapPathEdit } : {})}
      {...(levelMapLayoutEdit ? { levelMapLayoutEdit } : {})}
    />
  </div>
);
