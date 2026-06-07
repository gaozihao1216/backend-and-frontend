import { useCallback, useEffect, useState } from "react";
import {
  ascendPlayerBird,
  getPlayerPreparation,
  upgradePlayerBird,
  upgradePlayerSlingshot,
  type BirdUpgradeState,
  type PlayerPreparationState,
} from "../api/player-preparation-api.js";
import { readSelectedBirdType, writeSelectedBirdType } from "../lib/player-bird-selection.js";

type PlayerPreparationPageProps = {
  userId: string;
};

export const PlayerPreparationPage = ({ userId }: PlayerPreparationPageProps) => {
  const [state, setState] = useState<PlayerPreparationState | null>(null);
  const [selectedBirdType, setSelectedBirdType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadState = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextState = await getPlayerPreparation(userId);
      setState(nextState);
      setSelectedBirdType((current) => {
        const stored = readSelectedBirdType(userId);
        if (stored && nextState.birds.some((bird) => bird.birdType === stored)) {
          return stored;
        }

        return current ?? nextState.birds[0]?.birdType ?? null;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载备战数据失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const selectedBird: BirdUpgradeState | null =
    state?.birds.find((bird) => bird.birdType === selectedBirdType) ?? null;

  const handleUpgradeBird = async (birdType: string) => {
    setBusyKey(`upgrade:${birdType}`);
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

  const handleAscendBird = async (birdType: string) => {
    setBusyKey(`ascend:${birdType}`);
    setError("");
    setNotice("");
    try {
      const nextState = await ascendPlayerBird(userId, birdType);
      setState(nextState);
      const bird = nextState.birds.find((item) => item.birdType === birdType);
      setNotice(bird ? `${bird.name} 已升阶至 ${bird.tier} 阶` : "升阶成功");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "鸟类升阶失败");
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
          <p className="panel-copy">
            先选择要培养的鸟，再查看详情。升级消耗金币提升数值，升阶消耗碎片强化技能机制。
          </p>
        </div>
        {state ? (
          <div className="player-preparation-wallet">
            <div>
              <span>金币</span>
              <strong>{state.walletCoins}</strong>
            </div>
            <div>
              <span>碎片</span>
              <strong>{state.walletFragments}</strong>
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="feedback error">{error}</p> : null}
      {notice ? <p className="feedback success">{notice}</p> : null}
      {loading ? <p className="panel-copy">加载中…</p> : null}

      {!loading && state ? (
        <div className="player-preparation-grid">
          <section className="player-preparation-section">
            <h3>选择鸟类</h3>
            <div className="player-bird-picker">
              {state.birds.map((bird) => (
                <button
                  key={bird.birdType}
                  type="button"
                  className={selectedBirdType === bird.birdType ? "player-bird-picker-item is-active" : "player-bird-picker-item"}
                  onClick={() => {
                    setSelectedBirdType(bird.birdType);
                    writeSelectedBirdType(userId, bird.birdType);
                  }}
                >
                  <strong>{bird.name}</strong>
                  <span>
                    {bird.source === "designer" ? "设计师 · " : ""}
                    Lv.{bird.level} · {bird.tier} 阶
                  </span>
                </button>
              ))}
            </div>

            {selectedBird ? (
              <article className="player-bird-detail">
                <div className="player-bird-detail-preview">
                  <img src={selectedBird.previewImageUrl} alt={`${selectedBird.name} 预览`} />
                  <p className="panel-copy">动画预览占位图，后续可替换为循环播放动画。</p>
                </div>

                <div className="player-bird-detail-body">
                  <div className="player-bird-detail-head">
                    <div>
                      <h4>
                        {selectedBird.name}
                        {selectedBird.source === "designer" ? (
                          <span className="player-bird-source-badge">设计师作品</span>
                        ) : null}
                      </h4>
                      <p className="panel-copy">{selectedBird.summary}</p>
                    </div>
                    <div className="player-bird-badges">
                      <span>Lv.{selectedBird.level}/{selectedBird.maxLevel}</span>
                      <span>{selectedBird.tier} 阶 / {selectedBird.maxTier} 阶</span>
                    </div>
                  </div>

                  <div className="player-bird-stats">
                    <h5>当前数值</h5>
                    <dl>
                      <div><dt>攻击</dt><dd>{selectedBird.stats.attack}</dd></div>
                      <div><dt>冲击</dt><dd>{selectedBird.stats.impact}</dd></div>
                      <div><dt>速度</dt><dd>{selectedBird.stats.speed}</dd></div>
                    </dl>
                    <p className="panel-copy">升级主要提升攻击、冲击、速度等基础数值。</p>
                  </div>

                  <div className="player-bird-skill">
                    <h5>{selectedBird.skillName}</h5>
                    <p>{selectedBird.skillDescription}</p>
                    {selectedBird.nextTierSkillPreview ? (
                      <p className="player-bird-skill-next">
                        下一阶预览：{selectedBird.nextTierSkillPreview}
                      </p>
                    ) : (
                      <p className="panel-copy">技能机制已满阶。</p>
                    )}
                    <p className="panel-copy">升阶会改变技能机制，而不是单纯叠加数值。</p>
                  </div>

                  <div className="player-bird-actions">
                    <button
                      type="button"
                      disabled={
                        selectedBird.level >= selectedBird.maxLevel
                        || busyKey === `upgrade:${selectedBird.birdType}`
                      }
                      onClick={() => void handleUpgradeBird(selectedBird.birdType)}
                    >
                      {selectedBird.level >= selectedBird.maxLevel
                        ? "已满级"
                        : busyKey === `upgrade:${selectedBird.birdType}`
                          ? "升级中…"
                          : `升级 (${selectedBird.nextCostCoins} 金币)`}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      disabled={
                        selectedBird.tier >= selectedBird.maxTier
                        || busyKey === `ascend:${selectedBird.birdType}`
                      }
                      onClick={() => void handleAscendBird(selectedBird.birdType)}
                    >
                      {selectedBird.tier >= selectedBird.maxTier
                        ? "已满阶"
                        : busyKey === `ascend:${selectedBird.birdType}`
                          ? "升阶中…"
                          : `升阶 (${selectedBird.nextCostFragments} 碎片)`}
                    </button>
                  </div>
                </div>
              </article>
            ) : null}
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
