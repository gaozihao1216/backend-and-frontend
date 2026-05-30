import { useEffect, useState } from "react";
import { EditorToolbar } from "../../components/designer/EditorToolbar.js";
import { LevelEditorCanvas } from "../../components/designer/LevelEditorCanvas.js";
import { RotationKnob } from "../../components/designer/RotationKnob.js";
import { SelectedEntityPanel } from "../../components/designer/SelectedEntityPanel.js";
import { LevelPreviewCard } from "../../components/game/LevelPreviewCard.js";
import { getDefaultGroundMaterialRenderConfig } from "../../game/draw-scene.js";
import { createLevel, submitLevel } from "../../lib/api.js";
import { API_USERS } from "../../lib/config.js";
import {
  clearTerrainCeilingBoundary,
  DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG,
  createBottomBoundaryFromTop,
  ensureTerrainCeilingBoundary,
  getDefaultBoundaryBreakpointEpsilon,
  getLevelTerrain,
  removeTerrainBoundaryPoint,
  removeTerrainVoidSpan,
  reorderTerrainBoundaryPoint,
  setTerrainBoundaryType,
  type TerrainEditMode,
} from "../../lib/ground.js";
import { createDraftLevelSource, createPublishedLevelSource } from "../../lib/level-repository.js";
import {
  getEntitySnapshots,
  getEntitySnapshot,
  getGroupTransformSnapshot,
  getMinimumAreaSelectionFrame,
  getSelectionBounds,
  getSelectionFrame,
  pasteClipboardSelection,
  removeEntity,
  rotateEntitiesAroundSelectionCenter,
  selectSingleEntity,
  updateObstacleAngle,
  type EditorClipboardSelection,
  type EditorTool,
} from "../../lib/designer-level.js";
import type { Level, LevelData, LevelTag, Submission } from "../../../shared/types.js";
import { useDesignerDraft, availableTags } from "./hooks/useDesignerDraft.js";
import { MAX_UNDO_STEPS, useDesignerHistory } from "./hooks/useDesignerHistory.js";
import { MAX_DESIGNER_BACKUPS, useDesignerBackups } from "./hooks/useDesignerBackups.js";
import { useDesignerGroundTuning } from "./hooks/useDesignerGroundTuning.js";
import { isEditableTarget, useDesignerKeyboardShortcuts } from "./hooks/useDesignerKeyboardShortcuts.js";
import { cloneLevelData, formatArchiveTimestamp, serializeDraft } from "./functions/draft-functions.js";
import { GROUND_TUNING_LIMITS, normalizeAngle } from "./functions/ground-tuning-functions.js";
import type { DesignerBackup, DesignerPageProps, DesignerPhase } from "./objects/designer-page-types.js";
import { ArchivePanel } from "./components/ArchivePanel.js";
import { DesignerHeader } from "./components/DesignerHeader.js";
import { DesignerWorkspace } from "./components/DesignerWorkspace.js";
import { DesignBookPanel } from "./components/DesignBookPanel.js";
import { GroundTuningPanel } from "./components/GroundTuningPanel.js";
import { JsonCheckPanel } from "./components/JsonCheckPanel.js";
import { LevelFormPanel } from "./components/LevelFormPanel.js";

export const DesignerPage = ({
  userId = API_USERS.designer.id,
  mode = "design",
  archiveBackupId,
  onBack,
  onOpenSettingsPage,
  onExitSettingsPage,
  onOpenDesignBook,
  onExitDesignBook,
  onOpenJsonCheck,
  onExitJsonCheck,
  onOpenArchive,
  onExitArchive,
  onOpenArchiveJsonCheck,
  onExitArchiveJsonCheck,
}: DesignerPageProps) => {
  // 设计器页面同时维护三类状态：
  // 1. 关卡表单（标题、描述、标签）
  // 2. 可视化编辑状态（当前工具、选中对象）
  // 3. 后端交互结果（已创建关卡、提交成功消息等）
  const {
    title,
    setTitle,
    description,
    setDescription,
    selectedTags,
    setSelectedTags,
    levelData,
    setLevelData,
    jsonText,
    setJsonText,
    jsonError,
    setJsonError,
    createdLevels,
    setCreatedLevels,
    submittedIds,
    setSubmittedIds,
    message,
    setMessage,
    error,
    setError,
  } = useDesignerDraft();
  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [primarySelectedEntityId, setPrimarySelectedEntityId] = useState<string | null>(null);
  const [clipboardSelection, setClipboardSelection] = useState<EditorClipboardSelection | null>(null);
  const [canvasPointer, setCanvasPointer] = useState<{ x: number; y: number } | null>(null);
  const [gridSize, setGridSize] = useState(16);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [groupRotationAngle, setGroupRotationAngle] = useState(0);
  const [groupSelectionCenter, setGroupSelectionCenter] = useState<{ x: number; y: number } | null>(null);
  const [groupSelectionSize, setGroupSelectionSize] = useState<{ width: number; height: number } | null>(null);
  const { undoHistory, setUndoHistory, redoHistory, setRedoHistory, clearHistory } = useDesignerHistory();
  const { designerBackups, setDesignerBackups } = useDesignerBackups();
  const {
    groundStrokeSimplifyConfig,
    setGroundStrokeSimplifyConfig,
    boundaryBreakpointEpsilon,
    setBoundaryBreakpointEpsilonState,
    groundMaterialRenderConfig,
    setGroundMaterialRenderConfigState,
    updateGroundStrokeSimplifyConfig,
    updateBoundaryBreakpointEpsilon,
    updateGroundMaterialRenderConfig,
  } = useDesignerGroundTuning();
  const [designerPhase, setDesignerPhase] = useState<DesignerPhase>("ground");
  const [groundEditorEnabled, setGroundEditorEnabled] = useState(true);
  const [terrainEditMode, setTerrainEditMode] = useState<TerrainEditMode>("ground-boundary");
  const [bottomThickness, setBottomThickness] = useState(96);
  const [selectedGroundPointIndex, setSelectedGroundPointIndex] = useState<number | null>(null);
  const [selectedVoidSpanId, setSelectedVoidSpanId] = useState<string | null>(null);
  const isTitleMissing = title.trim().length === 0;
  const selectedObstacle = levelData.obstacles.find((obstacle) => obstacle.id === primarySelectedEntityId) ?? null;
  const draftPreviewLevel = createDraftLevelSource({
    title,
    description,
    tags: selectedTags,
    data: levelData,
    authorId: userId,
  }).level;
  const archiveBackup = archiveBackupId
    ? designerBackups.find((backup) => backup.archiveId === archiveBackupId) ?? null
    : null;
  const terrain = getLevelTerrain(levelData);
  const activeBoundaryKind = terrainEditMode === "ceiling-boundary" ? "ceiling" : "ground";
  const activeBoundary = activeBoundaryKind === "ceiling" ? terrain.ceilingBoundary ?? null : terrain.groundBoundary;

  const resetEditorSelection = () => {
    setSelectedEntityIds([]);
    setPrimarySelectedEntityId(null);
    setSelectedGroundPointIndex(null);
    setSelectedVoidSpanId(null);
    setActiveTool("select");
    setGroupRotationAngle(0);
    setGroupSelectionCenter(null);
    setGroupSelectionSize(null);
  };

  const switchDesignerPhase = (nextPhase: DesignerPhase) => {
    setDesignerPhase(nextPhase);
    setSelectedEntityIds([]);
    setPrimarySelectedEntityId(null);
    setSelectedGroundPointIndex(null);
    setSelectedVoidSpanId(null);
    setGroundEditorEnabled(nextPhase === "ground");
    setActiveTool("select");
  };

  const restoreDraft = (draft: {
    title: string;
    description: string;
    selectedTags: LevelTag[];
    levelData: LevelData;
  }) => {
    setTitle(draft.title);
    setDescription(draft.description);
    setSelectedTags(draft.selectedTags);
    setLevelData(cloneLevelData(draft.levelData));
    setJsonText(JSON.stringify(draft.levelData, null, 2));
    setJsonError("");
    resetEditorSelection();
  };

  const applyLevelDataUpdate = (updater: LevelData | ((current: LevelData) => LevelData)) => {
    // 所有对 levelData 的修改都走这一层，确保 JSON 面板与画布视图始终同步。
    setLevelData((current) => {
      const nextLevelData = typeof updater === "function" ? updater(current) : updater;
      if (nextLevelData === current) {
        return current;
      }

      setUndoHistory((history) => [cloneLevelData(current), ...history].slice(0, MAX_UNDO_STEPS));
      setRedoHistory([]);
      setJsonText(JSON.stringify(nextLevelData, null, 2));
      setJsonError("");
      return nextLevelData;
    });
  };

  const handleUndo = () => {
    setUndoHistory((history) => {
      const previousLevelData = history[0];
      if (!previousLevelData) {
        return history;
      }

      setLevelData(cloneLevelData(previousLevelData));
      setJsonText(JSON.stringify(previousLevelData, null, 2));
      setJsonError("");
      setRedoHistory((redo) => [cloneLevelData(levelData), ...redo].slice(0, MAX_UNDO_STEPS));
      resetEditorSelection();
      return history.slice(1);
    });
  };

  const handleRedo = () => {
    setRedoHistory((history) => {
      const nextLevelData = history[0];
      if (!nextLevelData) {
        return history;
      }

      setUndoHistory((undo) => [cloneLevelData(levelData), ...undo].slice(0, MAX_UNDO_STEPS));
      setLevelData(cloneLevelData(nextLevelData));
      setJsonText(JSON.stringify(nextLevelData, null, 2));
      setJsonError("");
      resetEditorSelection();
      return history.slice(1);
    });
  };

  const handleCreateBackup = () => {
    const draft = {
      title,
      description,
      selectedTags: [...selectedTags],
      levelData: cloneLevelData(levelData),
    };
    const draftSignature = serializeDraft(draft);
    if (designerBackups.some((backup) => serializeDraft(backup) === draftSignature)) {
      setMessage("当前内容与已有备份一致，已跳过重复备份");
      setError("");
      return;
    }

    const createdAtDate = new Date();
    const backup: DesignerBackup = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      archiveId: formatArchiveTimestamp(createdAtDate),
      createdAt: createdAtDate.toISOString(),
      ...draft,
    };

    setDesignerBackups((current) => [backup, ...current].slice(0, MAX_DESIGNER_BACKUPS));
    setMessage(`已保存备份 ${new Date(backup.createdAt).toLocaleString("zh-CN")}`);
    setError("");
  };

  const handleRestoreBackup = (backupId: string) => {
    const backup = designerBackups.find((item) => item.id === backupId);
    if (!backup) {
      return;
    }

    restoreDraft(backup);
    setUndoHistory([]);
    setRedoHistory([]);
    setMessage(`已恢复备份 ${new Date(backup.createdAt).toLocaleString("zh-CN")}`);
    setError("");
  };

  const handleDeleteSelected = () => {
    if (selectedEntityIds.length === 0) {
      return;
    }

    applyLevelDataUpdate((current) =>
      selectedEntityIds.reduce((nextLevelData, entityId) => removeEntity(nextLevelData, entityId), current),
    );
    setSelectedEntityIds([]);
    setPrimarySelectedEntityId(null);
  };

  useDesignerKeyboardShortcuts(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const modifierPressed = event.ctrlKey || event.metaKey;
      const snapshot = primarySelectedEntityId ? getEntitySnapshot(levelData, primarySelectedEntityId) : null;
      const snapshots = getEntitySnapshots(levelData, selectedEntityIds);

      if (modifierPressed && !event.shiftKey && event.key.toLowerCase() === "z") {
        if (undoHistory.length === 0) {
          return;
        }

        event.preventDefault();
        handleUndo();
        return;
      }

      if (
        modifierPressed
        && (
          event.key.toLowerCase() === "y"
          || (event.shiftKey && event.key.toLowerCase() === "z")
        )
      ) {
        if (redoHistory.length === 0) {
          return;
        }

        event.preventDefault();
        handleRedo();
        return;
      }

      if (modifierPressed && event.key.toLowerCase() === "c") {
        if (snapshots.length === 0) {
          return;
        }

        event.preventDefault();
        setClipboardSelection({
          entities: snapshots,
          primaryEntityId: primarySelectedEntityId,
        });
        return;
      }

      if (modifierPressed && event.key.toLowerCase() === "x") {
        if (!primarySelectedEntityId || !snapshot) {
          return;
        }

        event.preventDefault();
        setClipboardSelection({
          entities: snapshots,
          primaryEntityId: primarySelectedEntityId,
        });
        applyLevelDataUpdate((current) =>
          selectedEntityIds.reduce((nextLevelData, entityId) => removeEntity(nextLevelData, entityId), current),
        );
        setSelectedEntityIds([]);
        setPrimarySelectedEntityId(null);
        setActiveTool("select");
        return;
      }

      if (modifierPressed && event.key.toLowerCase() === "v") {
        if (!clipboardSelection || !canvasPointer) {
          return;
        }

        event.preventDefault();
        const pasted = pasteClipboardSelection(levelData, clipboardSelection, canvasPointer);
        if (!pasted) {
          return;
        }

        applyLevelDataUpdate(pasted.levelData);
        setSelectedEntityIds(pasted.entityIds);
        setPrimarySelectedEntityId(pasted.primaryEntityId);
        setActiveTool("select");
        return;
      }

      if (event.key === "Delete" && groundEditorEnabled && terrainEditMode === "hollow" && selectedVoidSpanId) {
        event.preventDefault();
        applyLevelDataUpdate((current) => removeTerrainVoidSpan(current, selectedVoidSpanId));
        setSelectedVoidSpanId(null);
        return;
      }

      if (event.key === "Delete" && groundEditorEnabled && selectedGroundPointIndex !== null && terrainEditMode !== "hollow") {
        event.preventDefault();
        const removed = removeTerrainBoundaryPoint(levelData, activeBoundaryKind, selectedGroundPointIndex);
        applyLevelDataUpdate(removed.levelData);
        setSelectedGroundPointIndex(removed.nextSelectedPointIndex);
        return;
      }

      // 设计器支持 Delete 快捷删除，行为与图形编辑工具保持一致。
      if (event.key !== "Delete" || selectedEntityIds.length === 0) {
        return;
      }

      event.preventDefault();
      applyLevelDataUpdate((current) =>
        selectedEntityIds.reduce((nextLevelData, entityId) => removeEntity(nextLevelData, entityId), current),
      );
      setSelectedEntityIds([]);
      setPrimarySelectedEntityId(null);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setIsAltPressed(false);
      }
    };

    const handleModifierState = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setIsAltPressed(event.type === "keydown");
      }
    };

    return { handleKeyDown, handleKeyUp, handleModifierState };
  }, [activeBoundaryKind, canvasPointer, clipboardSelection, groundEditorEnabled, levelData, primarySelectedEntityId, redoHistory, selectedEntityIds, selectedGroundPointIndex, selectedVoidSpanId, terrainEditMode, undoHistory]);

  useEffect(() => {
    if (selectedEntityIds.length > 1) {
      const frame = getMinimumAreaSelectionFrame(levelData, selectedEntityIds);
      setGroupRotationAngle(frame?.rotation ?? 0);
      setGroupSelectionCenter(frame ? { x: frame.centerX, y: frame.centerY } : null);
      setGroupSelectionSize(frame ? { width: frame.width, height: frame.height } : null);
      return;
    }

    setGroupRotationAngle(0);
    setGroupSelectionCenter(null);
    setGroupSelectionSize(null);
  }, [selectedEntityIds, primarySelectedEntityId]);

  useEffect(() => {
    if (selectedEntityIds.length === 0) {
      return;
    }

    const nextSelectedIds = selectedEntityIds.filter((entityId) =>
      levelData.obstacles.some((obstacle) => obstacle.id === entityId)
      || levelData.enemies.some((enemy) => enemy.id === entityId),
    );
    if (nextSelectedIds.length !== selectedEntityIds.length) {
      setSelectedEntityIds(nextSelectedIds);
      setPrimarySelectedEntityId(
        primarySelectedEntityId && nextSelectedIds.includes(primarySelectedEntityId)
          ? primarySelectedEntityId
          : nextSelectedIds.at(-1) ?? null,
      );
    }
  }, [levelData, primarySelectedEntityId, selectedEntityIds]);

  const handleJsonTextChange = (nextJsonText: string) => {
    setJsonText(nextJsonText);
    setJsonError("");
  };

  const handleConfirmJsonChange = () => {
    try {
      const parsedLevelData = JSON.parse(jsonText) as LevelData;
      applyLevelDataUpdate(parsedLevelData);
      setJsonError("");
      onExitJsonCheck?.();
    } catch (caught) {
      setJsonError(caught instanceof Error ? caught.message : "Invalid JSON");
    }
  };

  const handleCreate = async () => {
    setError("");
    setMessage("");

    if (isTitleMissing) {
      setError("请先填写 Title，再创建关卡。");
      return;
    }

    try {
      // create 只负责保存草稿关卡，不会自动进入审核流程。
      const level = await createLevel(userId, {
        title,
        description,
        tags: selectedTags,
        data: levelData,
      });
      setCreatedLevels((current) => [level, ...current]);
      setMessage(`Created level ${level.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create level");
    }
  };

  const toggleTag = (tag: LevelTag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((candidate) => candidate !== tag) : [...current, tag],
    );
  };

  const handleSubmit = async (levelId: string) => {
    setError("");
    setMessage("");

    try {
      // submit 针对已经创建到后端的 levelId，而不是当前本地草稿。
      const submission: Submission = await submitLevel(userId, levelId);
      setSubmittedIds((current) => [...current, submission.levelId]);
      setMessage(`Submitted ${submission.levelId} for review`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit level");
    }
  };

  if (mode === "archive_json_check") {
    if (!archiveBackup) {
      return (
        <section className="panel designer-workspace-panel designer-json-check-page">
          <div className="actions">
            <button type="button" className="secondary" onClick={onExitArchiveJsonCheck}>
              退出
            </button>
          </div>
          <h2>{`archive_${archiveBackupId ?? "unknown"}/json_check`}</h2>
          <p className="feedback error">未找到对应的备份。</p>
        </section>
      );
    }

    return (
      <JsonCheckPanel
        title={`archive_${archiveBackupId ?? "unknown"}/json_check`}
        description="这里展示的是备份对应的 JSON 内容，只读查看，不会修改当前 design 草稿。"
        label="Backup JSON"
        value={JSON.stringify(archiveBackup.levelData, null, 2)}
        readOnly
        onExit={onExitArchiveJsonCheck}
      />
    );
  }

  if (mode === "archive") {
    return (
      <ArchivePanel
        archiveBackupId={archiveBackupId}
        archiveBackup={archiveBackup}
        terrainEditMode={terrainEditMode}
        groundStrokeSimplifyConfig={groundStrokeSimplifyConfig}
        onExitArchive={onExitArchive}
        onOpenArchiveJsonCheck={onOpenArchiveJsonCheck}
        onRestore={(backup) => {
          restoreDraft(backup);
          clearHistory();
          onExitArchive?.();
        }}
      />
    );
  }

  if (mode === "json_check") {
    return (
      <JsonCheckPanel
        title="designer/design/json_check"
        description="在这里查看或修改当前设计草稿的 JSON 文件。只有点击“确认修改”后才会写回设计器。"
        label="LevelData JSON"
        value={jsonText}
        error={jsonError}
        onExit={onExitJsonCheck}
        onConfirm={handleConfirmJsonChange}
        onChange={handleJsonTextChange}
      />
    );
  }

  if (mode === "settings") {
    return (
      <GroundTuningPanel>
        <section className="panel designer-workspace-panel designer-doc-page">
        <div className="actions">
          <button type="button" className="secondary" onClick={onExitSettingsPage}>
            返回设计页
          </button>
        </div>
        <div className="designer-doc-hero">
          <div>
            <p className="eyebrow">designer/design/settings</p>
            <h2>地形设置</h2>
            <p className="panel-copy">
              这里集中放置边界重绘和自动生成地面时会用到的参数，避免主设计页被大量调参控件打断。所有修改都会立即写入本地浏览器，并作用到后续的重绘操作。
            </p>
          </div>
          <div className="designer-doc-summary-grid">
            <div className="designer-doc-summary-card">
              <span>最小局部跨度</span>
              <strong>{groundStrokeSimplifyConfig.minSpan}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>转角权重</span>
              <strong>{groundStrokeSimplifyConfig.angleWeight.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>停止阈值</span>
              <strong>{groundStrokeSimplifyConfig.stopEpsilon.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>断点阈值</span>
              <strong>{boundaryBreakpointEpsilon}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>无草坡度</span>
              <strong>{groundMaterialRenderConfig.noGrassSlope.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>Cliff 区间</span>
              <strong>{`${groundMaterialRenderConfig.cliffStart.toFixed(2)} → ${groundMaterialRenderConfig.cliffEnd.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>a1 / a2</span>
              <strong>{`${groundMaterialRenderConfig.a1.toFixed(2)} / ${groundMaterialRenderConfig.a2.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>alpha</span>
              <strong>{`${groundMaterialRenderConfig.alphaBase.toFixed(2)} ± ${groundMaterialRenderConfig.alphaJitter.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>Sigmoid</span>
              <strong>{`${groundMaterialRenderConfig.sigmoidA.toFixed(2)} / ${groundMaterialRenderConfig.sigmoidGamma.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>噪声强度</span>
              <strong>{groundMaterialRenderConfig.noiseStrength.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>草土曲线</span>
              <strong>{`${groundMaterialRenderConfig.grassCurveSampleStep}px / ${groundMaterialRenderConfig.grassCurveSmoothingPasses}次`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>默认厚度</span>
              <strong>{bottomThickness}</strong>
            </div>
          </div>
        </div>
        <div className="designer-ground-tuning-panel">
          <div className="card-header">
            <strong>抽稀调参</strong>
            <button
              type="button"
              className="secondary"
              onClick={() => setGroundStrokeSimplifyConfig(DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG)}
            >
              恢复默认
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setBoundaryBreakpointEpsilonState(getDefaultBoundaryBreakpointEpsilon())}
            >
              重置断点阈值
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setGroundMaterialRenderConfigState(getDefaultGroundMaterialRenderConfig())}
            >
              重置材质参数
            </button>
          </div>
          <div className="designer-ground-tuning-grid">
            <label className="designer-ground-tuning-field">
              <span>最小局部跨度</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.minSpan.min}
                max={GROUND_TUNING_LIMITS.minSpan.max}
                step={GROUND_TUNING_LIMITS.minSpan.step}
                value={groundStrokeSimplifyConfig.minSpan}
                onChange={(event) => updateGroundStrokeSimplifyConfig("minSpan", Number(event.target.value))}
              />
              <strong>{groundStrokeSimplifyConfig.minSpan}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>转角权重</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.angleWeight.min}
                max={GROUND_TUNING_LIMITS.angleWeight.max}
                step={GROUND_TUNING_LIMITS.angleWeight.step}
                value={groundStrokeSimplifyConfig.angleWeight}
                onChange={(event) => updateGroundStrokeSimplifyConfig("angleWeight", Number(event.target.value))}
              />
              <strong>{groundStrokeSimplifyConfig.angleWeight.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>停止阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.stopEpsilon.min}
                max={GROUND_TUNING_LIMITS.stopEpsilon.max}
                step={GROUND_TUNING_LIMITS.stopEpsilon.step}
                value={groundStrokeSimplifyConfig.stopEpsilon}
                onChange={(event) => updateGroundStrokeSimplifyConfig("stopEpsilon", Number(event.target.value))}
              />
              <strong>{groundStrokeSimplifyConfig.stopEpsilon.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>断点阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.breakpointEpsilon.min}
                max={GROUND_TUNING_LIMITS.breakpointEpsilon.max}
                step={GROUND_TUNING_LIMITS.breakpointEpsilon.step}
                value={boundaryBreakpointEpsilon}
                onChange={(event) => updateBoundaryBreakpointEpsilon(Number(event.target.value))}
              />
              <strong>{boundaryBreakpointEpsilon}</strong>
            </label>
          </div>
          <p className="meta">
            `最小局部跨度` 越大，抽稀越偏向大结构；`转角权重` 越大，急弯越容易保点；`停止阈值` 越大，整体会更稀疏；`断点阈值` 越大，点越容易被识别为贴近上下边界的断点。修改后会立即作用到编辑器与运行时，并保存在本地浏览器。
          </p>
        </div>
        <div className="designer-ground-tuning-panel">
          <div className="card-header">
            <strong>地形材质渲染</strong>
            <span>运行时预览中的地面着色手感</span>
          </div>
          <div className="designer-ground-tuning-grid">
            <label className="designer-ground-tuning-field">
              <span>无草坡度阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.noGrassSlope.min}
                max={GROUND_TUNING_LIMITS.noGrassSlope.max}
                step={GROUND_TUNING_LIMITS.noGrassSlope.step}
                value={groundMaterialRenderConfig.noGrassSlope}
                onChange={(event) => updateGroundMaterialRenderConfig("noGrassSlope", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.noGrassSlope.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Cliff Start</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.cliffStart.min}
                max={GROUND_TUNING_LIMITS.cliffStart.max}
                step={GROUND_TUNING_LIMITS.cliffStart.step}
                value={groundMaterialRenderConfig.cliffStart}
                onChange={(event) => updateGroundMaterialRenderConfig("cliffStart", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.cliffStart.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Cliff End</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.cliffEnd.min}
                max={GROUND_TUNING_LIMITS.cliffEnd.max}
                step={GROUND_TUNING_LIMITS.cliffEnd.step}
                value={groundMaterialRenderConfig.cliffEnd}
                onChange={(event) => updateGroundMaterialRenderConfig("cliffEnd", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.cliffEnd.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>岩石增强</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.cliffRockBoost.min}
                max={GROUND_TUNING_LIMITS.cliffRockBoost.max}
                step={GROUND_TUNING_LIMITS.cliffRockBoost.step}
                value={groundMaterialRenderConfig.cliffRockBoost}
                onChange={(event) => updateGroundMaterialRenderConfig("cliffRockBoost", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.cliffRockBoost.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>噪声强度</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.noiseStrength.min}
                max={GROUND_TUNING_LIMITS.noiseStrength.max}
                step={GROUND_TUNING_LIMITS.noiseStrength.step}
                value={groundMaterialRenderConfig.noiseStrength}
                onChange={(event) => updateGroundMaterialRenderConfig("noiseStrength", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.noiseStrength.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>a1 草阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.a1.min}
                max={GROUND_TUNING_LIMITS.a1.max}
                step={GROUND_TUNING_LIMITS.a1.step}
                value={groundMaterialRenderConfig.a1}
                onChange={(event) => updateGroundMaterialRenderConfig("a1", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.a1.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>a2 土阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.a2.min}
                max={GROUND_TUNING_LIMITS.a2.max}
                step={GROUND_TUNING_LIMITS.a2.step}
                value={groundMaterialRenderConfig.a2}
                onChange={(event) => updateGroundMaterialRenderConfig("a2", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.a2.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>alpha 基值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.alphaBase.min}
                max={GROUND_TUNING_LIMITS.alphaBase.max}
                step={GROUND_TUNING_LIMITS.alphaBase.step}
                value={groundMaterialRenderConfig.alphaBase}
                onChange={(event) => updateGroundMaterialRenderConfig("alphaBase", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.alphaBase.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>alpha 扰动</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.alphaJitter.min}
                max={GROUND_TUNING_LIMITS.alphaJitter.max}
                step={GROUND_TUNING_LIMITS.alphaJitter.step}
                value={groundMaterialRenderConfig.alphaJitter}
                onChange={(event) => updateGroundMaterialRenderConfig("alphaJitter", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.alphaJitter.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Sigmoid A</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.sigmoidA.min}
                max={GROUND_TUNING_LIMITS.sigmoidA.max}
                step={GROUND_TUNING_LIMITS.sigmoidA.step}
                value={groundMaterialRenderConfig.sigmoidA}
                onChange={(event) => updateGroundMaterialRenderConfig("sigmoidA", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.sigmoidA.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Sigmoid Beta</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.sigmoidBeta.min}
                max={GROUND_TUNING_LIMITS.sigmoidBeta.max}
                step={GROUND_TUNING_LIMITS.sigmoidBeta.step}
                value={groundMaterialRenderConfig.sigmoidBeta}
                onChange={(event) => updateGroundMaterialRenderConfig("sigmoidBeta", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.sigmoidBeta.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Sigmoid Gamma</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.sigmoidGamma.min}
                max={GROUND_TUNING_LIMITS.sigmoidGamma.max}
                step={GROUND_TUNING_LIMITS.sigmoidGamma.step}
                value={groundMaterialRenderConfig.sigmoidGamma}
                onChange={(event) => updateGroundMaterialRenderConfig("sigmoidGamma", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.sigmoidGamma.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>草土曲线采样步长</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.grassCurveSampleStep.min}
                max={GROUND_TUNING_LIMITS.grassCurveSampleStep.max}
                step={GROUND_TUNING_LIMITS.grassCurveSampleStep.step}
                value={groundMaterialRenderConfig.grassCurveSampleStep}
                onChange={(event) => updateGroundMaterialRenderConfig("grassCurveSampleStep", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.grassCurveSampleStep}px</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>草土曲线平滑轮数</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.min}
                max={GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.max}
                step={GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.step}
                value={groundMaterialRenderConfig.grassCurveSmoothingPasses}
                onChange={(event) => updateGroundMaterialRenderConfig("grassCurveSmoothingPasses", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.grassCurveSmoothingPasses}</strong>
            </label>
          </div>
          <p className="meta">
            `a1` 与 `a2` 控制场函数 `f(x,y)` 的分类阈值：小于 `a1` 为草，介于 `a1` 和 `a2` 为土，大于 `a2` 为石；`alpha 基值` 和 `alpha 扰动` 控制深度幂次推进速度及其局部随机变化；`Sigmoid A/Beta/Gamma` 控制斜率项 `S(slope)` 的整体高度、陡峭程度和拐点位置；`Cliff Start/End` 控制 `cliffFactor` 从开始生效到完全生效的坡度区间；`无草坡度阈值` 决定多陡开始直接禁用草层；`岩石增强` 会抬高陡坡上的石层倾向；`噪声强度` 控制最终明暗扰动幅度；`草土曲线采样步长` 和 `平滑轮数` 控制粗采样后的草土分界线拟合手感。
          </p>
        </div>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>参数说明</strong>
            <span>影响下一次笔画转边界的结果</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>最小局部跨度</h3>
              <p>控制局部几何在多小的范围内可以被继续细分。值越小，短促起伏越容易保留下来；值越大，系统越倾向把小幅波动视为噪声。</p>
              <p className="meta">适合场景：精修小洞顶、小台阶、密集折返时适当调小；做大轮廓山体时适当调大。</p>
            </article>
            <article className="designer-doc-card">
              <h3>转角权重</h3>
              <p>控制算法对“急弯”的敏感程度。值越大，明显转角越不容易被删点，轮廓会更贴近手绘的转折感。</p>
              <p className="meta">适合场景：想保留悬崖折角、洞口尖锐感时提高；想要更平顺的自然曲线时降低。</p>
            </article>
            <article className="designer-doc-card">
              <h3>停止阈值</h3>
              <p>控制抽稀过程在多早阶段停止。值越大，允许更早结束，结果会更稀疏；值越小，会继续保留更多控制点。</p>
              <p className="meta">适合场景：大地图草图用较大值，细修可下调。</p>
            </article>
            <article className="designer-doc-card">
              <h3>默认厚度</h3>
              <p>点击“根据天花板生成地面”时，会把当前天花板按这个厚度向下偏移，生成一份地面初稿。它不会自动跟随重绘，只在你手动触发时生效。</p>
              <p className="meta">适合场景：快速搭一个上下封闭的洞穴、隧道或漂浮平台实体。</p>
            </article>
            <article className="designer-doc-card">
              <h3>断点阈值</h3>
              <p>控制一个内部点需要离上边界或下边界多近，才会被视为断点。被识别为断点后，该点会切开实体段，中间未连接部分会被当成空洞。</p>
              <p className="meta">适合场景：想更容易切出悬崖、洞口断层时调大；想避免误触发切段时调小。</p>
            </article>
            <article className="designer-doc-card">
              <h3>场函数材质判定</h3>
              <p>当前运行时地面材质不是直接渐变，而是对每个采样点计算 `f(x,y)`。具体做法是：先求该 `x` 处的坡度绝对值 `slopeAbs`，再求该点距地表的相对深度 `depthRatio`，然后构造 `slopeFactor * depthRatio^alphaLocal`。其中 `alphaLocal = alphaBase + noise(x) * alphaJitter`，随机项只沿 `x` 方向连续变化。</p>
              <p className="meta">分类规则：`f(x,y) &lt; a1` 为草，`a1 ≤ f(x,y) &lt; a2` 为土，`f(x,y) ≥ a2` 为石；若坡度超过无草阈值，则草层直接禁用。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>推荐调参手感</strong>
            <span>先确定结构，再追求细节</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>草图阶段</h3>
              <p>建议使用较大的最小局部跨度和停止阈值，先让轮廓足够干净。这个阶段重点是确定地图节奏，而不是把每个小起伏都画出来。</p>
            </article>
            <article className="designer-doc-card">
              <h3>细修阶段</h3>
              <p>当主体结构稳定后，再降低跨度和停止阈值，提高转角权重，专门修悬崖边、台阶口、洞顶转折这些玩家感知最强的位置。</p>
            </article>
            <article className="designer-doc-card">
              <h3>避免误区</h3>
              <p>不要一开始就把参数调得很“灵”。过于敏感的抽稀会把手抖和偶然噪声也固化进边界，后续更难维护。</p>
            </article>
          </div>
        </section>
        </section>
      </GroundTuningPanel>
    );
  }

  if (mode === "design_book") {
    return (
      <DesignBookPanel>
        <section className="panel designer-workspace-panel designer-doc-page">
        <div className="actions">
          <button type="button" className="secondary" onClick={onExitDesignBook}>
            返回设计页
          </button>
        </div>
        <div className="designer-doc-hero">
          <div>
            <p className="eyebrow">designer/design/design_book</p>
            <h2>设计指导</h2>
            <p className="panel-copy">
              这个页面用于集中说明地形编辑器的工作方式、交互规则和数据约束。主设计页只保留动作入口，这里负责解释为什么这么设计，以及正确的使用顺序。
            </p>
          </div>
          <div className="designer-doc-callout">
            <strong>当前地形模型</strong>
            <p>地形由 `groundBoundary` 和 `voidSpans` 组成，`ceilingBoundary` 是可选项。默认可以没有天花板；一旦绘制出来，它会和地面一样生成实体碰撞。悬崖虚空用于把某段地面切成真实空区。</p>
          </div>
        </div>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>建议流程</strong>
            <span>先形体，后玩法，最后验证</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>1. 先画天花板</h3>
              <p>如果这个关卡需要洞顶、山洞上壁、压顶岩层之类的上方阻挡结构，再去画天花板。默认情况下可以完全没有这一层。</p>
            </article>
            <article className="designer-doc-card">
              <h3>2. 再画地面</h3>
              <p>地面负责承载站立、滚落和接触反馈。你可以直接手绘，也可以先用“根据天花板生成地面”做一份偏移初稿，再局部精修。</p>
            </article>
            <article className="designer-doc-card">
              <h3>3. 切悬崖虚空</h3>
              <p>在已经成型的地面上切掉若干横向区间，制造断崖、深坑、悬浮平台之间的空档。这个操作不是挖洞多边形，而是把一段地面变成虚空。</p>
            </article>
            <article className="designer-doc-card">
              <h3>4. 摆放实体</h3>
              <p>当天花板、地面和虚空段稳定后，再进入第二阶段布置木块、石块、玻璃和 pig，避免频繁返工碰撞基础。</p>
            </article>
            <article className="designer-doc-card">
              <h3>5. 最后试玩验证</h3>
              <p>只在主要几何关系确定后再开预览。这样更容易把问题归因到具体结构，而不是在草图阶段被频繁的物理重建打断。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>模式说明</strong>
            <span>三个模式分别改三种数据</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>上边界编辑</h3>
              <p>这里的“上边界”是地图天花板，不是地形顶面。它用于描述洞顶、岩壁顶缘、压顶层等上方阻挡结构，且默认可以不存在。</p>
              <p className="meta">对应数据：`terrain.ceilingBoundary`</p>
            </article>
            <article className="designer-doc-card">
              <h3>下边界编辑</h3>
              <p>这里的“下边界”是玩家可接触的地面轮廓。它定义站立面、坡面、坑缘、平台底部支撑等主要落脚结构。</p>
              <p className="meta">对应数据：`terrain.groundBoundary`</p>
            </article>
            <article className="designer-doc-card">
              <h3>镂空 / 悬崖虚空</h3>
              <p>该模式通过横向区间切除地面实体，形成真正的空白带。被切掉的范围不再提供地面碰撞，两侧自然形成断边和悬崖。</p>
              <p className="meta">对应数据：`terrain.voidSpans`</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>交互规则</strong>
            <span>画布中的主要编辑行为</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>局部放大</h3>
              <p>缩放链位于编辑画布外，可连续调整局部放大倍率。倍率映射不是线性的，而是指数形式，因此 100% 到 200% 区间更容易细调。</p>
              <p className="meta">缩放链会在 100% / 200% / 400% / 800% 附近自动吸附；“复位”按钮会一直显示，便于随时回到 100%。</p>
            </article>
            <article className="designer-doc-card">
              <h3>框选放大与平移</h3>
              <p>按住 Ctrl 在画布中拖拽，可以快速框选一个局部区域并放大到该范围。进入放大状态后，滚轮用于上下平移，Shift + 滚轮用于左右平移。</p>
              <p className="meta">建议先用框选放大定位区域，再用缩放链做精细倍率调整。</p>
            </article>
            <article className="designer-doc-card">
              <h3>重绘边界</h3>
              <p>在边界编辑模式下，于画布空白区域拖拽即可重绘当前边界。系统会把手绘轨迹抽稀，再转换为折线或贝塞尔控制点。</p>
            </article>
            <article className="designer-doc-card">
              <h3>点编辑</h3>
              <p>选中控制点后可以重排或删除中间点。首尾点承担左右封边职责，通常不建议作为普通中间点处理。</p>
            </article>
            <article className="designer-doc-card">
              <h3>网格吸附</h3>
              <p>按住 Alt 会临时显示网格并启用吸附。适合做规则结构、对齐平台、控制断崖边距，也适合第二阶段摆放物体时保持整洁。</p>
            </article>
            <article className="designer-doc-card">
              <h3>悬崖切除</h3>
              <p>进入“悬崖虚空”模式后横向拖拽，即可生成一个 void span。它本质是 x 区间切除，不要求用户画闭合面。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>碰撞与几何约束</strong>
            <span>当前版本的实现边界</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>天花板与地面同类处理</h3>
              <p>运行时会把天花板和地面都当成“地形边界实体”来建模，渲染和碰撞只是在法线方向与视觉语义上不同，本质逻辑是一致的。</p>
            </article>
            <article className="designer-doc-card">
              <h3>虚空段优先切地面</h3>
              <p>当前虚空段主要影响地面实体切分，用于形成深坑、断崖与平台空档。它不会单独修改天花板轮廓。</p>
            </article>
            <article className="designer-doc-card">
              <h3>早期碰撞简化</h3>
              <p>当前碰撞使用简化边界段构建，重点保证编辑迭代效率。后续如果要支持更复杂的体积判定，再考虑引入更完整的地形碰撞模型。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>材质场函数说明</strong>
            <span>运行时地表颜色不是固定渐变</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>整体思路</h3>
              <p>当前运行时的地面材质不是直接从绿色渐变到棕色，而是对每个采样点计算一个场函数 `f(x,y)`，再依据阈值判断当前点属于草、土还是石。这样可以把坡度、深度和局部随机变化统一进一个可调模型里。</p>
            </article>
            <article className="designer-doc-card">
              <h3>深度项</h3>
              <p>对当前采样点先计算该 `x` 位置地表高度 `surfaceY(x)`，再计算当前点到地表的相对深度 `depthRatio`。深度项使用幂次而不是指数，形式接近 `depthRatio^alphaLocal`，其中 `alphaLocal` 会被连续噪声场轻微扰动。</p>
            </article>
            <article className="designer-doc-card">
              <h3>斜率项</h3>
              <p>坡度绝对值 `|slope|` 先进入一个 sigmoid 函数 `S(slope)`，当前实现中 `Sigmoid A / Beta / Gamma` 分别控制整体高度、曲线陡峭程度和拐点位置。随后还会叠加 `cliffFactor` 和 `noGrassSlope` 的附加影响，让悬崖区域更快偏向岩石。</p>
            </article>
            <article className="designer-doc-card">
              <h3>分类阈值</h3>
              <p>最终场函数形式接近 `f(x,y) = slopeFactor * depthRatio^alphaLocal`。然后用 `a1 / a2` 做离散分类：`f &lt; a1` 判为草，`a1 ≤ f &lt; a2` 判为土，`f ≥ a2` 判为石。当坡度超过 `noGrassSlope` 时，草阈值会被直接禁用。</p>
            </article>
            <article className="designer-doc-card">
              <h3>随机信号</h3>
              <p>随机信号已经退化成一维连续噪声，只沿 `x` 方向变化，并满足空间局域性。它不会直接决定颜色类别，而是用于扰动 `alphaLocal`，从而改变局部地层推进速度；`noiseStrength` 则只影响最终显示明暗，不直接影响草土石分类。</p>
            </article>
            <article className="designer-doc-card">
              <h3>草土分界曲线</h3>
              <p>为了避免粗采样方块直接暴露在最终视觉里，运行时会先按较大步长扫描每个 `x` 列中 `f(x,y)=a1` 的过渡点，再把这些点经过多轮局部平滑后拟合成一条连续曲线，用它作为草层和土层之间的分界。</p>
              <p className="meta">`grassCurveSampleStep` 越小越贴近原始分层、但点更多；`grassCurveSmoothingPasses` 越大越顺滑、但会更概括。</p>
            </article>
            <article className="designer-doc-card">
              <h3>土石分界曲线</h3>
              <p>同样地，运行时也会扫描 `f(x,y)=a2` 的过渡点，并生成土层与石层之间的分界线。最终渲染不再逐个小格判色，而是直接对“地表到草土线”、“草土线到土石线”、“土石线到底边”三段带状区域分别填色。</p>
              <p className="meta">这样可以把场函数的计算集中在边界提取阶段，后续只按三条曲线之间的区域做填充，明显减轻逐像素或逐方块渲染负担。</p>
            </article>
            <article className="designer-doc-card">
              <h3>建议调参顺序</h3>
              <p>先调 `Sigmoid Gamma` 和 `Cliff Start / End`，确定什么坡度开始显著石化；再调 `noGrassSlope` 控制悬崖彻底禁草的时机；然后用 `a1 / a2 / alphaBase / alphaJitter` 修草土石分层厚薄与局部变化；最后再用 `grassCurveSampleStep / grassCurveSmoothingPasses` 收草土边界的视觉手感。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>快捷键</strong>
            <span>设计器常用操作</span>
          </div>
          <div className="designer-doc-inline-list">
            <span>Ctrl / Cmd + Z：撤销</span>
            <span>Ctrl / Cmd + Y：重做</span>
            <span>Ctrl / Cmd + C / X / V：复制、剪切、粘贴实体</span>
            <span>Delete：删除选中实体</span>
            <span>Shift：追加选择</span>
            <span>Alt：显示网格并启用网格吸附</span>
          </div>
        </section>
        </section>
      </DesignBookPanel>
    );
  }

  return (
    <section className="panel designer-workspace-panel">
      <DesignerHeader
        designerPhase={designerPhase}
        onBack={onBack}
        onOpenSettingsPage={onOpenSettingsPage}
        onOpenDesignBook={onOpenDesignBook}
        onPhaseChange={switchDesignerPhase}
      />

      <LevelFormPanel
        title={title}
        description={description}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onToggleTag={toggleTag}
      />

      {designerPhase === "entities" ? (
        <div className="designer-toolbar-row">
          <EditorToolbar activeTool={activeTool} onToolChange={setActiveTool} />
          <div className="rotation-controls-panel">
            <div className="rotation-controls">
              <RotationKnob
                label="粗调"
                angle={selectedEntityIds.length > 1 ? groupRotationAngle : selectedObstacle?.angle ?? 0}
                disabled={activeTool !== "rotate" || (selectedEntityIds.length === 1 ? !selectedObstacle : selectedEntityIds.length === 0)}
                precisionMultiplier={1}
                variant="coarse"
                onChange={(angle) => {
                  if (selectedEntityIds.length > 1) {
                    const snapshot = getGroupTransformSnapshot(levelData, selectedEntityIds);
                    const frame = groupSelectionCenter && groupSelectionSize
                      ? {
                          centerX: groupSelectionCenter.x,
                          centerY: groupSelectionCenter.y,
                          width: groupSelectionSize.width,
                          height: groupSelectionSize.height,
                          rotation: groupRotationAngle,
                        }
                      : getSelectionFrame(
                          levelData,
                          selectedEntityIds,
                          groupRotationAngle,
                          groupSelectionCenter ?? undefined,
                        );
                    if (!snapshot || !frame) {
                      return;
                    }

                    const deltaAngle = normalizeAngle(angle - groupRotationAngle);
                    const nextLevelData = rotateEntitiesAroundSelectionCenter(
                      levelData,
                      snapshot,
                      { x: frame.centerX, y: frame.centerY },
                      deltaAngle,
                    );
                    if (nextLevelData !== levelData) {
                      applyLevelDataUpdate(nextLevelData);
                      setGroupRotationAngle(angle);
                    }
                    return;
                  }

                  if (!selectedObstacle) {
                    return;
                  }

                  applyLevelDataUpdate((current) => updateObstacleAngle(current, selectedObstacle.id, angle));
                }}
              />
              <RotationKnob
                label="微调"
                angle={selectedEntityIds.length > 1 ? groupRotationAngle : selectedObstacle?.angle ?? 0}
                disabled={activeTool !== "rotate" || (selectedEntityIds.length === 1 ? !selectedObstacle : selectedEntityIds.length === 0)}
                precisionMultiplier={10}
                variant="fine"
                onChange={(angle) => {
                  if (selectedEntityIds.length > 1) {
                    const snapshot = getGroupTransformSnapshot(levelData, selectedEntityIds);
                    const frame = groupSelectionCenter && groupSelectionSize
                      ? {
                          centerX: groupSelectionCenter.x,
                          centerY: groupSelectionCenter.y,
                          width: groupSelectionSize.width,
                          height: groupSelectionSize.height,
                          rotation: groupRotationAngle,
                        }
                      : getSelectionFrame(
                          levelData,
                          selectedEntityIds,
                          groupRotationAngle,
                          groupSelectionCenter ?? undefined,
                        );
                    if (!snapshot || !frame) {
                      return;
                    }

                    const deltaAngle = normalizeAngle(angle - groupRotationAngle);
                    const nextLevelData = rotateEntitiesAroundSelectionCenter(
                      levelData,
                      snapshot,
                      { x: frame.centerX, y: frame.centerY },
                      deltaAngle,
                    );
                    if (nextLevelData !== levelData) {
                      applyLevelDataUpdate(nextLevelData);
                      setGroupRotationAngle(angle);
                    }
                    return;
                  }

                  if (!selectedObstacle) {
                    return;
                  }

                  applyLevelDataUpdate((current) => updateObstacleAngle(current, selectedObstacle.id, angle));
                }}
              />
            </div>
            <div className="rotation-angle-readout">
              <strong>{Math.round((((selectedEntityIds.length > 1 ? groupRotationAngle : selectedObstacle?.angle ?? 0) * 180) / Math.PI))}°</strong>
            </div>
          </div>
        </div>
      ) : null}
      <div className="designer-grid-controls">
        <label className="designer-grid-size">
          <span>网格间距</span>
          <select value={gridSize} onChange={(event) => setGridSize(Number(event.target.value))}>
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={24}>24</option>
          </select>
        </label>
      </div>
      {designerPhase === "ground" ? (
      <>
      <div className="designer-grid-controls designer-ground-controls">
          <label className="designer-grid-size">
            <span>{terrainEditMode === "ceiling-boundary" ? "天花板类型" : "地面类型"}</span>
            <select
            value={activeBoundary?.type ?? "line"}
            onChange={(event) => {
              const nextType = event.target.value as "line" | "bezier";
              applyLevelDataUpdate((current) => setTerrainBoundaryType(current, activeBoundaryKind, nextType));
            }}
            disabled={terrainEditMode === "hollow" || !activeBoundary}
          >
            <option value="line">Line</option>
            <option value="bezier">Bezier</option>
          </select>
        </label>
        <div className="designer-mode-toggle">
          <button
            type="button"
            className={terrainEditMode === "ceiling-boundary" ? "" : "secondary"}
            onClick={() => {
                setTerrainEditMode("ceiling-boundary");
                setSelectedGroundPointIndex(null);
                setSelectedVoidSpanId(null);
              }}
          >
            天花板编辑
          </button>
          <button
            type="button"
            className={terrainEditMode === "ground-boundary" ? "" : "secondary"}
            onClick={() => {
                setTerrainEditMode("ground-boundary");
                setSelectedGroundPointIndex(null);
                setSelectedVoidSpanId(null);
              }}
          >
            地面编辑
          </button>
          <button
            type="button"
            className={terrainEditMode === "hollow" ? "" : "secondary"}
              onClick={() => {
                setTerrainEditMode("hollow");
                setSelectedGroundPointIndex(null);
                setSelectedVoidSpanId(null);
              }}
            >
            悬崖虚空
          </button>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setGroundEditorEnabled((current) => !current);
            setSelectedGroundPointIndex(null);
            setSelectedVoidSpanId(null);
          }}
        >
          {groundEditorEnabled ? "结束地面编辑" : "编辑地面"}
        </button>
      </div>
      {groundEditorEnabled && terrainEditMode === "ceiling-boundary" ? (
        <div className="designer-grid-controls designer-ground-controls">
          <button
            type="button"
            className="secondary"
            disabled={!!terrain.ceilingBoundary}
            onClick={() => {
              applyLevelDataUpdate((current) => ensureTerrainCeilingBoundary(current));
              setSelectedGroundPointIndex(null);
            }}
          >
            创建天花板
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!terrain.ceilingBoundary}
            onClick={() => {
              applyLevelDataUpdate((current) => clearTerrainCeilingBoundary(current));
              setSelectedGroundPointIndex(null);
            }}
          >
            删除天花板
          </button>
          <span className="meta">
            天花板默认可以为空。创建后可继续拖拽控制点，首尾点不会被锁定到世界左右边界。
          </span>
        </div>
      ) : null}
      {groundEditorEnabled ? (
        <div className="designer-grid-controls designer-ground-controls">
          <label className="designer-grid-size">
            <span>默认厚度</span>
            <input
              type="range"
              min={48}
              max={220}
              step={4}
              value={bottomThickness}
              onChange={(event) => setBottomThickness(Number(event.target.value))}
            />
            <strong>{bottomThickness}</strong>
          </label>
          <button
            type="button"
            className="secondary"
            disabled={!terrain.ceilingBoundary}
            onClick={() => {
              applyLevelDataUpdate((current) => {
                const currentTerrain = getLevelTerrain(current);
                if (!currentTerrain.ceilingBoundary) {
                  return current;
                }
                return {
                  ...current,
                  ground: currentTerrain.groundBoundary,
                  terrain: {
                    ...currentTerrain,
                    groundBoundary: createBottomBoundaryFromTop(current, currentTerrain.ceilingBoundary, bottomThickness),
                  },
                };
              });
            }}
          >
            根据天花板生成地面
          </button>
        </div>
      ) : null}
      {groundEditorEnabled && terrainEditMode !== "hollow" ? (
        <div className="designer-grid-controls designer-ground-controls">
          <button
            type="button"
            className="secondary"
            disabled={selectedGroundPointIndex === null || selectedGroundPointIndex <= 1}
            onClick={() => {
              if (selectedGroundPointIndex === null) {
                return;
              }
              const reordered = reorderTerrainBoundaryPoint(levelData, activeBoundaryKind, selectedGroundPointIndex, "left");
              applyLevelDataUpdate(reordered.levelData);
              setSelectedGroundPointIndex(reordered.pointIndex);
            }}
          >
            向前重排
          </button>
          <button
            type="button"
            className="secondary"
            disabled={selectedGroundPointIndex === null || !activeBoundary || selectedGroundPointIndex >= (activeBoundary.type === "line" ? activeBoundary.points.length - 2 : activeBoundary.controlPoints.length - 2)}
            onClick={() => {
              if (selectedGroundPointIndex === null) {
                return;
              }
              const reordered = reorderTerrainBoundaryPoint(levelData, activeBoundaryKind, selectedGroundPointIndex, "right");
              applyLevelDataUpdate(reordered.levelData);
              setSelectedGroundPointIndex(reordered.pointIndex);
            }}
          >
            向后重排
          </button>
          <button
            type="button"
            className="secondary"
            disabled={
              selectedGroundPointIndex === null
              || !activeBoundary
              || (activeBoundary.type === "line" ? activeBoundary.points.length <= 2 : activeBoundary.controlPoints.length <= 3)
            }
            onClick={() => {
              if (selectedGroundPointIndex === null) {
                return;
              }
              const removed = removeTerrainBoundaryPoint(levelData, activeBoundaryKind, selectedGroundPointIndex);
              applyLevelDataUpdate(removed.levelData);
              setSelectedGroundPointIndex(removed.nextSelectedPointIndex);
            }}
          >
            删除当前点
          </button>
        </div>
      ) : null}
      {groundEditorEnabled && terrainEditMode === "hollow" ? (
        <div className="designer-grid-controls designer-ground-controls">
          <button
            type="button"
            className="secondary"
            disabled={!selectedVoidSpanId}
            onClick={() => {
              if (!selectedVoidSpanId) {
                return;
              }
              applyLevelDataUpdate((current) => removeTerrainVoidSpan(current, selectedVoidSpanId));
              setSelectedVoidSpanId(null);
            }}
          >
            删除当前虚空段
          </button>
        </div>
      ) : null}
      </>
      ) : null}
      <div className="actions">
        <button
          type="button"
          className="secondary"
          disabled={undoHistory.length === 0}
          onClick={handleUndo}
        >
          撤销
        </button>
        <button
          type="button"
          className="secondary"
          disabled={redoHistory.length === 0}
          onClick={handleRedo}
        >
          恢复
        </button>
        <button
          type="button"
          className="secondary"
          onClick={handleCreateBackup}
        >
          保存备份
        </button>
        <button
          type="button"
          className="secondary"
          disabled={designerPhase !== "entities" || selectedEntityIds.length === 0}
          onClick={handleDeleteSelected}
        >
          删除选中对象
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onOpenJsonCheck}
        >
          查看或修改Json文件
        </button>
      </div>
      <section className="designer-backup-panel">
        <div className="card-header">
          <strong>存档备份</strong>
          <span>最多保留 {MAX_DESIGNER_BACKUPS} 份，超出后自动替换最早备份</span>
        </div>
        {designerBackups.length === 0 ? <p className="meta">当前还没有备份。</p> : null}
        {designerBackups.map((backup) => (
          <div key={backup.id} className="designer-backup-item">
            <div>
              <strong>{backup.title || "未命名草稿"}</strong>
              <p className="meta">{new Date(backup.createdAt).toLocaleString("zh-CN")}</p>
            </div>
            <div className="designer-backup-actions">
              <button type="button" className="secondary" onClick={() => onOpenArchive?.(backup.archiveId)}>
                查看备份
              </button>
              <button type="button" className="secondary" onClick={() => handleRestoreBackup(backup.id)}>
                恢复
              </button>
            </div>
          </div>
        ))}
      </section>

      <DesignerWorkspace>
          <LevelEditorCanvas
            activeTool={activeTool}
            levelData={levelData}
            editorPhase={designerPhase}
            selectedEntityIds={selectedEntityIds}
            primarySelectedEntityId={primarySelectedEntityId}
            onChange={applyLevelDataUpdate}
            onSelectionChange={(entityIds, primaryEntityId) => {
              setSelectedEntityIds(entityIds);
              setPrimarySelectedEntityId(primaryEntityId);
            }}
            onToolChange={setActiveTool}
            onPointerWorldChange={setCanvasPointer}
            gridVisible={isAltPressed}
            gridSnapEnabled={isAltPressed}
            gridSize={gridSize}
            isSnapTemporarilyDisabled={false}
            groupSelectionRotationAngle={groupRotationAngle}
            onGroupSelectionRotationAngleChange={setGroupRotationAngle}
            groupSelectionCenter={groupSelectionCenter}
            onGroupSelectionCenterChange={setGroupSelectionCenter}
            groupSelectionSize={groupSelectionSize}
            onGroupSelectionSizeChange={setGroupSelectionSize}
            groundEditEnabled={groundEditorEnabled}
            terrainEditMode={terrainEditMode}
            groundStrokeSimplifyConfig={groundStrokeSimplifyConfig}
            selectedGroundPointIndex={selectedGroundPointIndex}
            onGroundPointSelectionChange={setSelectedGroundPointIndex}
            selectedVoidSpanId={selectedVoidSpanId}
            onVoidSpanSelectionChange={setSelectedVoidSpanId}
            entityEditingEnabled={designerPhase === "entities"}
          />
          {designerPhase === "entities" ? (
            <SelectedEntityPanel
              levelData={levelData}
              selectedEntityIds={selectedEntityIds}
              primarySelectedEntityId={primarySelectedEntityId}
            />
          ) : null}
      </DesignerWorkspace>

      <section className="comment-section">
        <div className="card-header">
          <strong>Draft Preview</strong>
          <span>Shared runtime</span>
        </div>
        <p className="meta">
          试玩预览改为按需打开。地面调整请优先直接看上方可视化编辑画布，避免频繁重建物理世界。
        </p>
        <LevelPreviewCard
          source={createDraftLevelSource({
            title,
            description,
            tags: selectedTags,
            data: draftPreviewLevel.data,
            authorId: userId,
          })}
        />
      </section>

      <div className="designer-create-actions">
        <button type="button" disabled={isTitleMissing} onClick={handleCreate}>
          Create Level
        </button>
        {isTitleMissing ? <p className="feedback error">请先填写 Title。</p> : null}
      </div>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <div className="list">
        <h3>Created In This Session</h3>
        {createdLevels.length === 0 ? <p>No levels created yet.</p> : null}
        {createdLevels.map((level) => {
          const isSubmitted = submittedIds.includes(level.id);
          return (
            <article key={level.id} className="card">
              <div className="card-header">
                <strong>{level.title}</strong>
                <span>{level.status}</span>
              </div>
              <p>{level.description || "No description"}</p>
              <div className="tag-list">
                {level.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="meta">Level ID: {level.id}</p>
              <LevelPreviewCard source={createPublishedLevelSource(level)} />
              <button
                type="button"
                disabled={isSubmitted}
                onClick={() => handleSubmit(level.id)}
              >
                {isSubmitted ? "Submitted" : "Submit For Review"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
