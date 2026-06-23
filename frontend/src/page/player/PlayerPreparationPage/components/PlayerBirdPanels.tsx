import type { BirdUpgradeState, PlayerPreparationState } from "../../../../api/player-preparation-api.js";

type PlayerBirdPickerProps = {
  birds: PlayerPreparationState["birds"];
  selectedBirdType: string | null;
  onSelectBird: (birdType: string) => void;
};

export const PlayerBirdPicker = ({
  birds,
  selectedBirdType,
  onSelectBird,
}: PlayerBirdPickerProps) => (
  <div className="player-bird-picker">
    {birds.map((bird) => (
      <button
        key={bird.birdType}
        type="button"
        className={selectedBirdType === bird.birdType ? "player-bird-picker-item is-active" : "player-bird-picker-item"}
        onClick={() => onSelectBird(bird.birdType)}
      >
        <strong>{bird.name}</strong>
        <span>
          {bird.source === "designer" ? "设计师 · " : ""}
          Lv.{bird.level} · {bird.tier} 阶
        </span>
      </button>
    ))}
  </div>
);

type PlayerBirdDetailProps = {
  bird: BirdUpgradeState;
  busyKey: string | null;
  onUpgrade: (birdType: string) => void;
  onAscend: (birdType: string) => void;
};

export const PlayerBirdDetail = ({
  bird,
  busyKey,
  onUpgrade,
  onAscend,
}: PlayerBirdDetailProps) => (
  <article className="player-bird-detail">
    <div className="player-bird-detail-preview">
      <img src={bird.previewImageUrl} alt={`${bird.name} 预览`} />
      <p className="panel-copy">动画预览占位图，后续可替换为循环播放动画。</p>
    </div>

    <div className="player-bird-detail-body">
      <div className="player-bird-detail-head">
        <div>
          <h4>
            {bird.name}
            {bird.source === "designer" ? (
              <span className="player-bird-source-badge">设计师作品</span>
            ) : null}
          </h4>
          <p className="panel-copy">{bird.summary}</p>
        </div>
        <div className="player-bird-badges">
          <span>Lv.{bird.level}/{bird.maxLevel}</span>
          <span>{bird.tier} 阶 / {bird.maxTier} 阶</span>
        </div>
      </div>

      <div className="player-bird-stats">
        <h5>当前数值</h5>
        <dl>
          <div><dt>攻击</dt><dd>{bird.stats.attack}</dd></div>
          <div><dt>冲击</dt><dd>{bird.stats.impact}</dd></div>
          <div><dt>速度</dt><dd>{bird.stats.speed}</dd></div>
        </dl>
        <p className="panel-copy">升级主要提升攻击、冲击、速度等基础数值。</p>
      </div>

      <div className="player-bird-skill">
        <h5>{bird.skillName}</h5>
        <p>{bird.skillDescription}</p>
        {bird.nextTierSkillPreview ? (
          <p className="player-bird-skill-next">
            下一阶预览：{bird.nextTierSkillPreview}
          </p>
        ) : (
          <p className="panel-copy">技能机制已满阶。</p>
        )}
        <p className="panel-copy">升阶会改变技能机制，而不是单纯叠加数值。</p>
      </div>

      <div className="player-bird-actions">
        <button
          type="button"
          disabled={bird.level >= bird.maxLevel || busyKey === `upgrade:${bird.birdType}`}
          onClick={() => void onUpgrade(bird.birdType)}
        >
          {bird.level >= bird.maxLevel
            ? "已满级"
            : busyKey === `upgrade:${bird.birdType}`
              ? "升级中…"
              : `升级 (${bird.nextCostCoins} 金币)`}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={bird.tier >= bird.maxTier || busyKey === `ascend:${bird.birdType}`}
          onClick={() => void onAscend(bird.birdType)}
        >
          {bird.tier >= bird.maxTier
            ? "已满阶"
            : busyKey === `ascend:${bird.birdType}`
              ? "升阶中…"
              : `升阶 (${bird.nextCostFragments} 碎片)`}
        </button>
      </div>
    </div>
  </article>
);
