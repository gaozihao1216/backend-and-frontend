import { useMemo, useState } from "react";
import { GameCanvas } from "../../../../components/level/GameCanvas.js";
import { buildSkillTestLaunchConfig } from "../../../../lib/build-skill-test-launch-config.js";
import type { BirdSkillSet } from "../../../../lib/game-engine/skills/skill-spec.js";
import { SKILL_TEST_LEVEL_DATA } from "../../../../shared/levels/skill-test-level.js";
import type { DirectorBirdSkillEntry } from "../../../../objects/bird/skill/director/director-bird-skill-entry.js";

type BirdSkillTestArenaProps = {
  entry: DirectorBirdSkillEntry;
  skillSet: BirdSkillSet;
  modelImageUrl: string;
};

export const BirdSkillTestArena = ({ entry, skillSet, modelImageUrl }: BirdSkillTestArenaProps) => {
  const [testTier, setTestTier] = useState(1);
  const [restartToken, setRestartToken] = useState(0);
  const [open, setOpen] = useState(true);

  const birdPoolConfig = useMemo(
    () => buildSkillTestLaunchConfig(entry, skillSet, testTier, modelImageUrl),
    [entry, skillSet, testTier, modelImageUrl],
  );

  const configKey = useMemo(
    () => JSON.stringify({ skillSet, testTier, birdType: entry.birdType, restartToken }),
    [skillSet, testTier, entry.birdType, restartToken],
  );

  return (
    <section className="bird-skill-test-arena feature-card">
      <div className="bird-skill-test-arena-head">
        <div>
          <h4>技能试玩关卡</h4>
          <p className="panel-copy">
            使用当前编辑器中的积木配置（无需先保存）。发射后点击屏幕触发技能；可切换测试阶数验证 1/2/3 阶差异。
          </p>
        </div>
        <div className="bird-skill-test-arena-actions">
          <label className="bird-skill-test-tier">
            <span>测试阶数</span>
            <select value={testTier} onChange={(event) => setTestTier(Number(event.target.value))}>
              <option value={1}>1 阶</option>
              <option value={2}>2 阶</option>
              <option value={3}>3 阶</option>
            </select>
          </label>
          <button type="button" className="secondary" onClick={() => setRestartToken((value) => value + 1)}>
            重新开始
          </button>
          <button type="button" className="secondary" onClick={() => setOpen((value) => !value)}>
            {open ? "收起试玩" : "展开试玩"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="bird-skill-test-arena-canvas-wrap">
          <GameCanvas
            key={configKey}
            levelKey={`skill-test-${entry.birdType}`}
            levelData={SKILL_TEST_LEVEL_DATA}
            birdPoolConfig={birdPoolConfig}
            restartToken={restartToken}
          />
          <ul className="bird-skill-test-arena-legend meta">
            <li>木塔 + 玻璃 + 石块，适合测冲击波、分裂、爆炸</li>
            <li>顶部与右侧各 1 只猪，适合测范围雷暴/中毒</li>
            <li>本关提供 5 次发射，均使用当前选中的「{entry.name}」</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
};
