import type { LevelData } from "../../lib/level-contracts.js";

type SelectedEntityPanelProps = {
  levelData: LevelData;
  selectedEntityIds: string[];
  primarySelectedEntityId: string | null;
};

export const SelectedEntityPanel = ({
  levelData,
  selectedEntityIds,
  primarySelectedEntityId,
}: SelectedEntityPanelProps) => {
  const selectedObstacle = levelData.obstacles.find((obstacle) => obstacle.id === primarySelectedEntityId) ?? null;
  const selectedEnemy = levelData.enemies.find((enemy) => enemy.id === primarySelectedEntityId) ?? null;

  return (
    <section className="designer-selected-panel">
      <div className="card-header">
        <strong>选中对象</strong>
        <span>{primarySelectedEntityId ?? "未选中"}</span>
      </div>

      {selectedEntityIds.length === 0 ? <p className="meta">请选择一个对象以查看和调整属性。</p> : null}

      {selectedEntityIds.length > 1 ? (
        <div className="designer-selected-fields">
          <p className="meta">已选中：{selectedEntityIds.length} 个对象</p>
          <p className="meta">主对象：{primarySelectedEntityId ?? "未设置"}</p>
          <p className="meta">当前阶段支持 Shift 多选和框选；主对象始终是最后选中的对象。</p>
        </div>
      ) : null}

      {selectedObstacle && selectedEntityIds.length === 1 ? (
        <div className="designer-selected-fields">
          <p className="meta">材质：{selectedObstacle.material}</p>
          <p className="meta">尺寸：{selectedObstacle.size.width} × {selectedObstacle.size.height}</p>
          <p className="meta">位置：({selectedObstacle.position.x.toFixed(0)}, {selectedObstacle.position.y.toFixed(0)})</p>
          <p className="meta">角度：{Math.round(((selectedObstacle.angle ?? 0) * 180) / Math.PI)}°</p>
          <p className="meta">拖动虚线框中心点可平移，拖动四角控制点可调整大小。</p>
          <p className="meta">拖动时会对附近对象的边和中心自动吸附，并显示黄线基准。</p>
        </div>
      ) : null}

      {selectedEnemy && selectedEntityIds.length === 1 ? (
        <div className="designer-selected-fields">
          <p className="meta">类型：{selectedEnemy.type}</p>
          <p className="meta">位置：({selectedEnemy.position.x.toFixed(0)}, {selectedEnemy.position.y.toFixed(0)})</p>
          <p className="meta">尺寸：{(selectedEnemy.size?.width ?? 56).toFixed(0)} × {(selectedEnemy.size?.height ?? 56).toFixed(0)}</p>
          <p className="meta">拖动虚线框中心点可平移。当前版本暂不支持调整猪的尺寸。</p>
          <p className="meta">拖动时同样会对附近对象的边和中心自动吸附。</p>
        </div>
      ) : null}
    </section>
  );
};
