import type { GroundMaterialRenderConfig } from "../../../game/draw-scene.js";
import type { GroundStrokeSimplifyConfig } from "../../../lib/ground.js";
import type { LevelData, LevelTag } from "../../../../lib/level-contracts.js";

export type DesignerGroundTuningStorage = Partial<GroundStrokeSimplifyConfig> & {
  breakpointEpsilon?: number;
  renderConfig?: Partial<GroundMaterialRenderConfig>;
};

export type DesignerBackup = {
  id: string;
  archiveId: string;
  createdAt: string;
  title: string;
  description: string;
  selectedTags: LevelTag[];
  levelData: LevelData;
};

export type DesignerPhase = "ground" | "entities";

export type DesignerPageMode =
  | "design"
  | "settings"
  | "design_book"
  | "json_check"
  | "archive"
  | "archive_json_check";

export type DesignerPageProps = {
  userId?: string;
  mode?: DesignerPageMode;
  archiveBackupId?: string;
  onBack?: () => void;
  onOpenSettingsPage?: () => void;
  onExitSettingsPage?: () => void;
  onOpenDesignBook?: () => void;
  onExitDesignBook?: () => void;
  onOpenJsonCheck?: () => void;
  onExitJsonCheck?: () => void;
  onOpenArchive?: (archiveBackupId: string) => void;
  onExitArchive?: () => void;
  onOpenArchiveJsonCheck?: (archiveBackupId: string) => void;
  onExitArchiveJsonCheck?: () => void;
};
