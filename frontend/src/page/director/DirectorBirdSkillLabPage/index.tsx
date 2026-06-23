import { useCallback, useEffect, useState } from "react";
import { getDirectorBirdSkillBoard, saveDirectorBirdSkill } from "../../../api/index.js";
import { BirdSkillScratchEditor, cloneEditorSkillSet } from "./components/BirdSkillScratchEditor.js";
import {
  BASIC_SKILLS,
  BOMB_SKILLS,
  SPLIT_SKILLS,
} from "../../../lib/game-engine/bird-definition.js";
import type { BirdSkillSet } from "../../../lib/game-engine/skills/skill-spec.js";
import type { DirectorBirdSkillEntry } from "../../../objects/bird/skill/director/director-bird-skill-entry.js";
import { cloneSkillSet, createDefaultSkillSet, parseBirdSkillSet } from "../../../objects/bird/skill/director/bird-skill-helpers.js";

type DirectorBirdSkillLabPageProps = {
  userId: string;
  onBack: () => void;
};

const systemDefaultSkillSet = (birdType: string): BirdSkillSet | null => {
  switch (birdType) {
    case "basic":
      return cloneSkillSet(BASIC_SKILLS);
    case "split":
      return cloneSkillSet(SPLIT_SKILLS);
    case "bomb":
      return cloneSkillSet(BOMB_SKILLS);
    default:
      return null;
  }
};

const resolveInitialSkillSet = (entry: DirectorBirdSkillEntry): BirdSkillSet => {
  const configured = parseBirdSkillSet(entry.skills);
  if (configured) {
    return cloneEditorSkillSet(configured);
  }

  const systemDefault = systemDefaultSkillSet(entry.birdType);
  if (systemDefault) {
    return systemDefault;
  }

  return createDefaultSkillSet(
    entry.birdType,
    entry.tierSkillDescriptions.map((text, index) => `${index + 1} 阶 · ${text}`),
  );
};

export const DirectorBirdSkillLabPage = ({ userId, onBack }: DirectorBirdSkillLabPageProps) => {
  const [birds, setBirds] = useState<DirectorBirdSkillEntry[]>([]);
  const [selectedBirdType, setSelectedBirdType] = useState<string>("");
  const [skillSet, setSkillSet] = useState<BirdSkillSet | null>(null);
  const [modelImageUrl, setModelImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedEntry = birds.find((bird) => bird.birdType === selectedBirdType) ?? null;

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const board = await getDirectorBirdSkillBoard(userId);
      setBirds(board.birds);
      setSelectedBirdType((current) => {
        if (current && board.birds.some((bird) => bird.birdType === current)) {
          return current;
        }
        return board.birds[0]?.birdType ?? "";
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载鸟类技能面板失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (!selectedEntry) {
      setSkillSet(null);
      setModelImageUrl("");
      return;
    }

    setSkillSet(resolveInitialSkillSet(selectedEntry));
    setModelImageUrl(selectedEntry.modelImageUrl ?? "");
  }, [selectedEntry?.birdType]);

  const handleSave = async () => {
    if (!selectedEntry || !skillSet) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveDirectorBirdSkill(userId, selectedEntry.birdType, {
        skills: skillSet,
        modelImageUrl: modelImageUrl.trim() ? modelImageUrl.trim() : null,
      });
      setMessage(`已保存 ${selectedEntry.name} 的技能配置。`);
      await loadBoard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存技能配置失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel director-bird-skill-lab-page">
      <div className="feature-header director-bird-skill-lab-header">
        <div>
          <p className="eyebrow">Bird Skill Lab</p>
          <h2>鸟类技能实验室</h2>
          <p className="panel-copy">
            将设计师文案落实为可运行的点击技能，并为小鸟配置建模图。系统鸟与设计师鸟使用同一套积木模板。
          </p>
        </div>
        <div className="director-bird-skill-lab-header-actions">
          <div className="feature-pill">技能配置</div>
          <button type="button" className="secondary" onClick={onBack}>
            返回工作台
          </button>
        </div>
      </div>

      {loading ? <p className="meta">正在加载鸟类列表...</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}

      <div className="director-bird-skill-lab-layout">
        <aside className="feature-card director-bird-skill-list">
          <div className="director-bird-skill-section-head">
            <h3>鸟类列表</h3>
            <p className="meta">选择一只鸟开始配置技能积木与建模图。</p>
          </div>
          <div className="director-bird-skill-list-items">
            {birds.map((bird) => (
              <button
                key={bird.birdType}
                type="button"
                className={`director-bird-skill-list-item${bird.birdType === selectedBirdType ? " active" : ""}`}
                onClick={() => setSelectedBirdType(bird.birdType)}
              >
                <span className="director-bird-skill-list-name">{bird.name}</span>
                <span className="director-bird-skill-list-meta">
                  <span>{bird.source === "designer" ? "设计师" : "系统"}</span>
                  <span className={bird.configured ? "is-configured" : "is-pending"}>
                    {bird.configured ? "已配置" : "未配置"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="director-bird-skill-editor-pane">
          {selectedEntry && skillSet ? (
            <BirdSkillScratchEditor
              entry={selectedEntry}
              skillSet={skillSet}
              modelImageUrl={modelImageUrl}
              onSkillSetChange={setSkillSet}
              onModelImageUrlChange={setModelImageUrl}
              onSave={() => void handleSave()}
              saving={saving}
            />
          ) : (
            <section className="feature-card director-bird-skill-empty">
              <p className="panel-copy">请选择一只鸟开始配置技能。</p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
};
