import { useCallback, useEffect, useState } from "react";
import { getDirectorBirdSkillBoard, saveDirectorBirdSkill } from "../../../../system/api/exports/index.js";
import { cloneEditorSkillSet } from "../components/BirdSkillScratchEditor.js";
import {
  BASIC_SKILLS,
  BOMB_SKILLS,
  SPLIT_SKILLS,
} from "../../../../game/engine/bird/bird-definition.js";
import type { BirdSkillSet } from "../../../../game/engine/skills/skill-spec.js";
import type { DirectorBirdSkillEntry } from "../../../../objects/bird/skill/director/director-bird-skill-entry.js";
import { cloneSkillSet, createDefaultSkillSet, parseBirdSkillSet } from "../../../../objects/bird/skill/director/bird-skill-helpers.js";

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

/**
 * 总监鸟类技能实验室状态。
 *
 * 负责加载鸟目录、把后端保存的技能 JSON 解析成编辑器状态，
 * 并在保存后刷新看板，保证测试场和准备页读取到同一套技能配置。
 */
export const useDirectorBirdSkillLabPage = (userId: string) => {
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

  return {
    birds,
    selectedBirdType,
    selectedEntry,
    skillSet,
    modelImageUrl,
    loading,
    saving,
    error,
    message,
    setSelectedBirdType,
    setSkillSet,
    setModelImageUrl,
    handleSave,
  };
};
