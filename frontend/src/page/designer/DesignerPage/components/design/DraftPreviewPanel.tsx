import { LevelPreviewCard } from "../../../../../component/level/LevelPreviewCard.js";
import { createDraftLevelSource } from "../../../../../lib/level-repository.js";
import type { LevelData } from "../../../../../objects/level/level/level-data.js";
import type { LevelTag } from "../../../../../objects/system/system-objects.js";

type DraftPreviewPanelProps = {
  title: string;
  description: string;
  tags: LevelTag[];
  data: LevelData;
  authorId: string;
};

export const DraftPreviewPanel = ({
  title,
  description,
  tags,
  data,
  authorId,
}: DraftPreviewPanelProps) => (
  <section className="comment-section">
    <div className="card-header">
      <strong>Draft Preview</strong>
      <span>Shared runtime</span>
    </div>
    <p className="meta">
      试玩预览改为按需打开。地面调整请优先直接看上方可视化编辑画布，避免频繁重建物理世界。
    </p>
    <LevelPreviewCard
      source={createDraftLevelSource({
        title,
        description,
        tags,
        data,
        authorId,
      })}
    />
  </section>
);
