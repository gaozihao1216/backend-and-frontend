import type { PlayerPreparationState } from "../../../../api/player-preparation-api.js";

type PlayerSlingshotPanelProps = {
  slingshot: PlayerPreparationState["slingshot"];
  busyKey: string | null;
  onUpgrade: () => void;
};

export const PlayerSlingshotPanel = ({
  slingshot,
  busyKey,
  onUpgrade,
}: PlayerSlingshotPanelProps) => (
  <section className="player-preparation-section">
    <h3>弹弓升级</h3>
    <article className="player-preparation-card player-preparation-slingshot">
      <div className="player-preparation-card-head">
        <strong>标准弹弓</strong>
        <span>Lv.{slingshot.level} / {slingshot.maxLevel}</span>
      </div>
      <p className="panel-copy">提升拉力与稳定性，让发射更精准。</p>
      <div className="player-preparation-progress">
        <div
          className="player-preparation-progress-fill"
          style={{ width: `${(slingshot.level / slingshot.maxLevel) * 100}%` }}
        />
      </div>
      <button
        type="button"
        disabled={slingshot.level >= slingshot.maxLevel || busyKey === "slingshot"}
        onClick={() => void onUpgrade()}
      >
        {slingshot.level >= slingshot.maxLevel
          ? "已满级"
          : busyKey === "slingshot"
            ? "升级中…"
            : `升级 (${slingshot.nextCostCoins} 金币)`}
      </button>
    </article>
  </section>
);
