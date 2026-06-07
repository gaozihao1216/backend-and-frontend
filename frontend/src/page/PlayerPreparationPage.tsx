import { useCallback, useEffect, useState } from "react";
import {
  getPlayerPreparation,
  upgradePlayerBird,
  upgradePlayerSlingshot,
  type PlayerPreparationState,
} from "../api/player-preparation-api.js";

type PlayerPreparationPageProps = {
  userId: string;
};

export const PlayerPreparationPage = ({ userId }: PlayerPreparationPageProps) => {
  const [state, setState] = useState<PlayerPreparationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadState = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setState(await getPlayerPreparation(userId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载备战数据失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const handleUpgradeBird = async (birdType: string) => {
    setBusyKey(`bird:${birdType}`);
    setError("");
    setNotice("");
    try {
      const nextState = await upgradePlayerBird(userId, birdType);
      setState(nextState);
      const bird = nextState.birds.find((item) => item.birdType === birdType);
      setNotice(bird ? `${bird.name} 已升级至 Lv.${bird.level}` : "升级成功");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "鸟类升级失败");
    } finally {
      setBusyKey(null);
    }
  };

  const handleUpgradeSlingshot = async () => {
    setBusyKey("slingshot");
    setError("");
    setNotice("");
    try {
      const nextState = await upgradePlayerSlingshot(userId);
      setState(nextState);
      setNotice(`弹弓已升级至 Lv.${nextState.slingshot.level}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "弹弓升级失败");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section className="panel player-preparation-page">
      <div className="player-preparation-header">
        <div>
          <h2>备战区域</h2>
          <p className="panel-copy">升级鸟类与弹弓，为下一关做准备。消耗金币，最高 5 级。</p>
        </div>
        {state ? (
          <div className="player-preparation-wallet">
            <span>当前金币</span>
            <strong>{state.walletCoins}</strong>
          </div>
        ) : null}
      </div>

      {error ? <p className="feedback error">{error}</p> : null}
      {notice ? <p className="feedback success">{notice}</p> : null}
      {loading ? <p className="panel-copy">加载中…</p> : null}

      {!loading && state ? (
        <div className="player-preparation-grid">
          <section className="player-preparation-section">
            <h3>鸟类升级</h3>
            <div className="player-preparation-cards">
              {state.birds.map((bird) => {
                const maxed = bird.level >= bird.maxLevel;
                const upgrading = busyKey === `bird:${bird.birdType}`;
                return (
                  <article key={bird.birdType} className="player-preparation-card">
                    <div className="player-preparation-card-head">
                      <strong>{bird.name}</strong>
                      <span>Lv.{bird.level} / {bird.maxLevel}</span>
                    </div>
                    <div className="player-preparation-progress">
                      <div
                        className="player-preparation-progress-fill"
                        style={{ width: `${(bird.level / bird.maxLevel) * 100}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={maxed || upgrading}
                      onClick={() => void handleUpgradeBird(bird.birdType)}
                    >
                      {maxed ? "已满级" : upgrading ? "升级中…" : `升级 (${bird.nextCostCoins} 金币)`}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="player-preparation-section">
            <h3>弹弓升级</h3>
            <article className="player-preparation-card player-preparation-slingshot">
              <div className="player-preparation-card-head">
                <strong>标准弹弓</strong>
                <span>Lv.{state.slingshot.level} / {state.slingshot.maxLevel}</span>
              </div>
              <p className="panel-copy">提升拉力与稳定性，让发射更精准。</p>
              <div className="player-preparation-progress">
                <div
                  className="player-preparation-progress-fill"
                  style={{ width: `${(state.slingshot.level / state.slingshot.maxLevel) * 100}%` }}
                />
              </div>
              <button
                type="button"
                disabled={state.slingshot.level >= state.slingshot.maxLevel || busyKey === "slingshot"}
                onClick={() => void handleUpgradeSlingshot()}
              >
                {state.slingshot.level >= state.slingshot.maxLevel
                  ? "已满级"
                  : busyKey === "slingshot"
                    ? "升级中…"
                    : `升级 (${state.slingshot.nextCostCoins} 金币)`}
              </button>
            </article>
          </section>
        </div>
      ) : null}
    </section>
  );
};
