import { useMemo, useState } from "react";
import type { BirdSkillSet, BirdSkillStage } from "../../lib/game-engine/skills/skill-spec.js";
import { SKILL_TEMPLATE_CATALOG } from "../../lib/game-engine/skills/skill-template-catalog.js";
import type { DirectorBirdSkillEntry } from "../../objects/bird/bird-skill-config.js";
import {
  appendSpec,
  cloneSkillSet,
  moveSpec,
  removeSpec,
  updateSpec,
  updateStage,
} from "../../objects/bird/bird-skill-config.js";
import { formatSpecSummary } from "../../lib/game-engine/skills/skill-param-metadata.js";
import { getSkillTemplateLabel, SkillBlockParamEditor } from "./BirdSkillBlockParamEditor.js";
import { BirdSkillTestArena } from "./BirdSkillTestArena.js";
import { readFileAsDataUrl } from "../../lib/template-image-utils.js";

type BirdSkillScratchEditorProps = {
  entry: DirectorBirdSkillEntry;
  skillSet: BirdSkillSet;
  modelImageUrl: string;
  onSkillSetChange: (next: BirdSkillSet) => void;
  onModelImageUrlChange: (next: string) => void;
  onSave: () => void;
  saving?: boolean;
};

export const BirdSkillScratchEditor = ({
  entry,
  skillSet,
  modelImageUrl,
  onSkillSetChange,
  onModelImageUrlChange,
  onSave,
  saving = false,
}: BirdSkillScratchEditorProps) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const activeStage = skillSet.stages[activeStageIndex] ?? skillSet.stages[0]!;
  const activeReference = entry.tierSkillDescriptions[activeStageIndex] ?? "";

  const paletteGroups = useMemo(() => ({
    motion: SKILL_TEMPLATE_CATALOG.filter((item) =>
      ["speed_boost", "split", "balloon_push", "vertical_bomb_drop"].includes(item.type),
    ),
    blast: SKILL_TEMPLATE_CATALOG.filter((item) =>
      ["forward_shockwave", "radial_shockwave", "point_blast"].includes(item.type),
    ),
    aura: SKILL_TEMPLATE_CATALOG.filter((item) =>
      ["lightning_storm", "burn_aura", "poison_aura"].includes(item.type),
    ),
  }), []);

  const patchStage = (stage: BirdSkillStage) => {
    onSkillSetChange(updateStage(skillSet, activeStageIndex, stage));
  };

  const handleAddBlock = (template: (typeof SKILL_TEMPLATE_CATALOG)[number]) => {
    const nextStage = appendSpec(activeStage, template.defaults);
    patchStage(nextStage);
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    onModelImageUrlChange(dataUrl);
  };

  return (
    <div className="bird-skill-scratch-editor">
      <header className="bird-skill-scratch-head">
        <div>
          <h3>{entry.name}</h3>
          <p className="panel-copy">
            {entry.source === "designer" ? "设计师鸟" : "系统鸟"} · 点击触发 · 积木顺序即执行顺序
          </p>
        </div>
        <div className="bird-skill-scratch-head-actions">
          <button type="button" onClick={onSave} disabled={saving}>
            {saving ? "保存中..." : "保存技能配置"}
          </button>
        </div>
      </header>

      <div className="bird-skill-scratch-layout">
        <aside className="bird-skill-scratch-reference">
          <h4>设计师文案参考</h4>
          <p className="meta">技能名：{entry.skillName}</p>
          <ol className="bird-skill-reference-list">
            {entry.tierSkillDescriptions.map((text, index) => (
              <li key={index}>
                <strong>{index + 1} 阶</strong>
                <span>{text}</span>
              </li>
            ))}
          </ol>

          <h4>小鸟建模图</h4>
          <div className="bird-skill-model-preview">
            {modelImageUrl ? <img src={modelImageUrl} alt={`${entry.name} 建模图`} /> : <p className="meta">尚未上传</p>}
          </div>
          <label className="bird-skill-model-upload">
            <span>上传建模图</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => void handleImageUpload(event.target.files?.[0])}
            />
          </label>
          <label className="bird-skill-model-upload">
            <span>图片 URL</span>
            <input
              value={modelImageUrl}
              onChange={(event) => onModelImageUrlChange(event.target.value)}
              placeholder="data:image/... 或 https://..."
            />
          </label>
        </aside>

        <section className="bird-skill-scratch-workspace">
          <div className="bird-skill-stage-tabs">
            {skillSet.stages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                className={`bird-skill-stage-tab${index === activeStageIndex ? " active" : ""}`}
                onClick={() => {
                  setActiveStageIndex(index);
                }}
              >
                {index + 1} 阶
              </button>
            ))}
          </div>

          <div className="bird-skill-stage-meta">
            <label>
              <span>阶段名称</span>
              <input
                value={activeStage.label}
                onChange={(event) => patchStage({ ...activeStage, label: event.target.value })}
              />
            </label>
            <label>
              <span>点击次数上限</span>
              <input
                type="number"
                min={1}
                max={5}
                value={activeStage.maxActivations ?? 1}
                onChange={(event) =>
                  patchStage({
                    ...activeStage,
                    maxActivations: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                  })}
              />
            </label>
            <label>
              <span>冷却 ms</span>
              <input
                type="number"
                min={0}
                step={50}
                value={activeStage.cooldownMs ?? 0}
                onChange={(event) =>
                  patchStage({
                    ...activeStage,
                    cooldownMs: Math.max(0, Math.floor(Number(event.target.value) || 0)),
                  })}
              />
            </label>
          </div>

          <div className="bird-skill-stage-reference">
            <strong>本阶文案：</strong>
            <span>{activeReference || "暂无设计师描述"}</span>
          </div>

          <div className="bird-skill-block-stack">
            <p className="bird-skill-stack-label">当 飞行中 · 点击屏幕 → 按顺序执行以下积木</p>
            {activeStage.specs.length === 0 ? (
              <div className="bird-skill-empty-stack">从右侧点击技能积木添加。每个积木都会带默认参数，可直接修改。</div>
            ) : (
              activeStage.specs.map((spec, index) => (
                <div key={`${spec.type}-${index}`} className="bird-skill-block">
                  <div className="bird-skill-block-toolbar">
                    <span className="bird-skill-block-order">#{index + 1}</span>
                    <button
                      type="button"
                      className="secondary"
                      disabled={index === 0}
                      onClick={() => patchStage(moveSpec(activeStage, index, index - 1))}
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      disabled={index === activeStage.specs.length - 1}
                      onClick={() => patchStage(moveSpec(activeStage, index, index + 1))}
                    >
                      下移
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => patchStage(removeSpec(activeStage, index))}
                    >
                      删除
                    </button>
                  </div>
                  <div className="bird-skill-block-title">{getSkillTemplateLabel(spec.type)}</div>
                  <ul className="bird-skill-block-summary">
                    {formatSpecSummary(spec).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <SkillBlockParamEditor
                    spec={spec}
                    onChange={(nextSpec) => {
                      patchStage(updateSpec(activeStage, index, nextSpec));
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="bird-skill-scratch-palette">
          <h4>技能积木库</h4>
          {(["motion", "blast", "aura"] as const).map((groupKey) => (
            <div key={groupKey} className="bird-skill-palette-group">
              <p className="bird-skill-palette-group-label">
                {groupKey === "motion" ? "位移 / 形态" : groupKey === "blast" ? "爆炸 / 冲击" : "范围状态"}
              </p>
              <div className="bird-skill-palette-list">
                {paletteGroups[groupKey].map((template, index) => (
                  <button
                    key={template.type}
                    type="button"
                    className="bird-skill-palette-block"
                    onClick={() => handleAddBlock(template)}
                  >
                    <strong>{template.label}</strong>
                    <span>{template.description}</span>
                    <ul className="bird-skill-palette-defaults">
                      {formatSpecSummary(template.defaults).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>

      <BirdSkillTestArena entry={entry} skillSet={skillSet} modelImageUrl={modelImageUrl} />
    </div>
  );
};

export const cloneEditorSkillSet = cloneSkillSet;
