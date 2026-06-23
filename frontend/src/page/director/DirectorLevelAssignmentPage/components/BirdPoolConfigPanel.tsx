import { DEFAULT_BIRD_POOL, type BirdPool } from "../../../../objects/level/inventory/bird-pool.js";
import type { BirdPoolOption } from "../../../../objects/admin/director/level_assignment/board/director-level-assignment-board.js";

const FALLBACK_SYSTEM_OPTIONS: BirdPoolOption[] = [
  { birdType: "basic", name: "基础鸟", source: "system" },
  { birdType: "split", name: "分裂鸟", source: "system" },
  { birdType: "bomb", name: "爆炸鸟", source: "system" },
];

type BirdPoolConfigPanelProps = {
  pool: BirdPool;
  birdOptions?: BirdPoolOption[];
  onChange: (pool: BirdPool) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
};

const mergeBirdOptions = (birdOptions: BirdPoolOption[], pool: BirdPool): BirdPoolOption[] => {
  const merged = new Map(birdOptions.map((option) => [option.birdType, option]));
  for (const birdType of pool.allowedBirdTypes) {
    if (!merged.has(birdType)) {
      merged.set(birdType, {
        birdType,
        name: birdType,
        source: birdType.startsWith("bird-design-") ? "designer" : "system",
      });
    }
  }

  return [...merged.values()];
};

export const BirdPoolConfigPanel = ({
  pool,
  birdOptions = FALLBACK_SYSTEM_OPTIONS,
  onChange,
  disabled = false,
  title = "鸟池配置",
  description = "设置本关总发射次数与允许鸟种。玩家每次发射前自行选鸟，顺序不固定。",
}: BirdPoolConfigPanelProps) => {
  const options = mergeBirdOptions(birdOptions, pool);
  const systemOptions = options.filter((option) => option.source === "system");
  const designerOptions = options.filter((option) => option.source === "designer");

  const toggleAllowedType = (birdType: string) => {
    const allowed = new Set(pool.allowedBirdTypes);
    if (allowed.has(birdType)) {
      allowed.delete(birdType);
    } else {
      allowed.add(birdType);
    }

    const nextCaps = { ...pool.caps };
    if (!allowed.has(birdType)) {
      delete nextCaps[birdType];
    }

    onChange({
      ...pool,
      allowedBirdTypes: [...allowed],
      caps: nextCaps,
    });
  };

  const updateCap = (birdType: string, rawValue: string) => {
    const parsed = Number(rawValue);
    const nextCaps = { ...pool.caps };
    if (!Number.isFinite(parsed) || parsed <= 0) {
      delete nextCaps[birdType];
    } else {
      nextCaps[birdType] = Math.floor(parsed);
    }

    onChange({
      ...pool,
      caps: nextCaps,
    });
  };

  const renderOptionRow = (option: BirdPoolOption) => {
    const checked = pool.allowedBirdTypes.includes(option.birdType);
    return (
      <div key={option.birdType} className="bird-pool-config-type-row">
        <label>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => toggleAllowedType(option.birdType)}
          />
          <span>{option.name}</span>
          {option.source === "designer" ? (
            <span className="bird-pool-config-designer-badge">设计师作品</span>
          ) : null}
        </label>
        {checked ? (
          <label className="bird-pool-config-cap">
            <span>上限</span>
            <input
              type="number"
              min={1}
              max={pool.totalBirds}
              placeholder="不限"
              value={pool.caps[option.birdType] ?? ""}
              onChange={(event) => updateCap(option.birdType, event.target.value)}
            />
          </label>
        ) : null}
      </div>
    );
  };

  return (
    <section className="bird-pool-config-panel">
      <div className="bird-pool-config-head">
        <h4>{title}</h4>
        <p className="panel-copy">{description}</p>
      </div>

      <label className="bird-pool-config-total">
        <span>总鸟数</span>
        <input
          type="number"
          min={1}
          max={12}
          value={pool.totalBirds}
          disabled={disabled}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange({
              ...pool,
              totalBirds: Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_BIRD_POOL.totalBirds,
            });
          }}
        />
      </label>

      <fieldset className="bird-pool-config-types" disabled={disabled}>
        <legend>允许鸟种（留空 = 不限制，玩家可用备战区任意鸟）</legend>
        <div className="bird-pool-config-type-list">
          {systemOptions.map(renderOptionRow)}
        </div>
        {designerOptions.length > 0 ? (
          <div className="bird-pool-config-designer-group">
            <p className="bird-pool-config-group-label">已发布设计师鸟</p>
            <div className="bird-pool-config-type-list">
              {designerOptions.map(renderOptionRow)}
            </div>
          </div>
        ) : (
          <p className="meta">当前还没有管理员审核通过的设计师鸟。</p>
        )}
      </fieldset>
    </section>
  );
};
