import { usePlayerPreparation } from "../../../hook/player-page/usePlayerPreparation.js";
import { PageFeedback } from "../../../component/player-page/PageFeedback.js";
import { PlayerBirdDetail, PlayerBirdPicker } from "../../../component/player-page/PlayerBirdPanels.js";
import { PlayerSlingshotPanel } from "../../../component/player-page/PlayerSlingshotPanel.js";

type PlayerPreparationPageProps = {
  userId: string;
};

export const PlayerPreparationPage = ({ userId }: PlayerPreparationPageProps) => {
  const prep = usePlayerPreparation(userId);

  return (
    <section className="panel player-preparation-page">
      <div className="player-preparation-header">
        <div>
          <h2>备战区域</h2>
          <p className="panel-copy">
            先选择要培养的鸟，再查看详情。升级消耗金币提升数值，升阶消耗碎片强化技能机制。
          </p>
        </div>
        {prep.state ? (
          <div className="player-preparation-wallet">
            <div>
              <span>金币</span>
              <strong>{prep.state.walletCoins}</strong>
            </div>
            <div>
              <span>碎片</span>
              <strong>{prep.state.walletFragments}</strong>
            </div>
          </div>
        ) : null}
      </div>

      <PageFeedback error={prep.error} notice={prep.notice} />
      {prep.loading ? <p className="panel-copy">加载中…</p> : null}

      {!prep.loading && prep.state ? (
        <div className="player-preparation-grid">
          <section className="player-preparation-section">
            <h3>选择鸟类</h3>
            <PlayerBirdPicker
              birds={prep.state.birds}
              selectedBirdType={prep.selectedBirdType}
              onSelectBird={prep.selectBirdType}
            />

            {prep.selectedBird ? (
              <PlayerBirdDetail
                bird={prep.selectedBird}
                busyKey={prep.busyKey}
                onUpgrade={prep.handleUpgradeBird}
                onAscend={prep.handleAscendBird}
              />
            ) : null}
          </section>

          <PlayerSlingshotPanel
            slingshot={prep.state.slingshot}
            busyKey={prep.busyKey}
            onUpgrade={prep.handleUpgradeSlingshot}
          />
        </div>
      ) : null}
    </section>
  );
};
