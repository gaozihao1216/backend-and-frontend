import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { LevelMapPathEditor } from "../component/director/LevelMapPathEditor.js";
import { LevelMapLayoutPreview } from "../component/director/LevelMapLayoutPreview.js";
import { LevelNodeButtonFormatEditor } from "../component/director/LevelNodeButtonFormatEditor.js";
import { LevelStageBackgroundEditor } from "../component/director/LevelStageBackgroundEditor.js";
import { getPageConfig, getPageConfigRevision, subscribePageConfigStore } from "../lib/ui-customization.js";
import { setSharedLevelMapPersistenceUser } from "../lib/shared-level-map-persistence.js";
import {
  applyLevelNodeButtonFormat,
  createPreviewLevelProgressUiData,
  getLevelNodeButtonFormatFromStore,
  LEVEL_NODE_PROGRESS_STATE_META,
  syncLevelNodeButtonFormat,
  type LevelNodeButtonFormatSettings,
  type LevelNodeProgressStateId,
} from "../lib/level-node-button-format.js";
import {
  applyLevelStageDecoration,
  getDefaultLevelStageDecoration,
  getLevelStageDecorationFromStore,
  normalizeLevelStageDecoration,
  syncLevelStageBackground,
} from "../lib/level-stage-background.js";
import {
  extractLevelNodeButtonLayouts,
  syncLevelNodeButtonLayout,
  updateLevelNodeButtonPositionInPage,
} from "../lib/level-node-button-layout.js";
import {
  applyLevelMapPathDesign,
  createLevelMapPathEdge,
  getLevelMapPathDesignFromStore,
  syncLevelMapPathDesign,
} from "../lib/level-map-path.js";
import type { LevelMapPathDesign } from "../objects/ui-customization/ui-customization-objects.js";
import type { LevelMapPathEditContext } from "../component/ui-renderer/ui-renderer-types.js";
import {
  countLevelNodes,
  findStagePanel,
  LEVEL_MAP_PAGE_ID,
} from "../lib/level-stage-structure.js";
import { LEVEL_NODE_DEFINITIONS } from "../objects/ui-customization/level-map-structure.js";
import type { ComponentPosition, PageConfig, PanelDecoration, UiPreviewUser } from "../objects/ui-customization/ui-customization-objects.js";

type DirectorLevelInterfacePageProps = {
  userId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
};

import { getUiPreviewUser } from "../objects/ui-customization/ui-customization-objects.js";

type ActiveEditor = "background" | "buttonFormat" | "pathDesign" | null;

export const DirectorLevelInterfacePage = ({ userId, onBack, onNavigate }: DirectorLevelInterfacePageProps) => {
  const pageConfigRevision = useSyncExternalStore(
    subscribePageConfigStore,
    getPageConfigRevision,
    getPageConfigRevision,
  );
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => getPageConfig(LEVEL_MAP_PAGE_ID));
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [draftDecoration, setDraftDecoration] = useState<PanelDecoration>(() => getDefaultLevelStageDecoration());
  const [draftButtonFormat, setDraftButtonFormat] = useState<LevelNodeButtonFormatSettings>(
    () => getLevelNodeButtonFormatFromStore(),
  );
  const [draftPathDesign, setDraftPathDesign] = useState<LevelMapPathDesign>(
    () => getLevelMapPathDesignFromStore(),
  );
  const [previewState, setPreviewState] = useState<LevelNodeProgressStateId>("notCleared");
  const [previewLevelSuffix, setPreviewLevelSuffix] = useState(LEVEL_NODE_DEFINITIONS[0]?.suffix ?? "level01");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingBackground, setSavingBackground] = useState(false);
  const [savingButtonFormat, setSavingButtonFormat] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [selectedLevelSuffix, setSelectedLevelSuffix] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pathConnectFrom, setPathConnectFrom] = useState<string | null>(null);
  const [savingPathDesign, setSavingPathDesign] = useState(false);

  useEffect(() => {
    setSharedLevelMapPersistenceUser(userId);

    let cancelled = false;

    void getLevelStageDecorationFromStore().then((decoration) => {
      if (!cancelled) {
        setPageConfig(getPageConfig(LEVEL_MAP_PAGE_ID));
        setDraftDecoration(decoration);
        setDraftButtonFormat(getLevelNodeButtonFormatFromStore());
        setDraftPathDesign(getLevelMapPathDesignFromStore());
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    setPageConfig(getPageConfig(LEVEL_MAP_PAGE_ID));

    if (activeEditor === "background") {
      return;
    }

    void getLevelStageDecorationFromStore().then((decoration) => {
      setDraftDecoration(decoration);
    });
  }, [activeEditor, pageConfigRevision]);

  const previewPageConfig = useMemo(() => {
    if (!pageConfig) {
      return null;
    }

    return applyLevelMapPathDesign(
      applyLevelNodeButtonFormat(
        applyLevelStageDecoration(pageConfig, draftDecoration),
        draftButtonFormat,
      ),
      draftPathDesign,
    );
  }, [draftButtonFormat, draftDecoration, draftPathDesign, pageConfig]);

  const previewUiData = useMemo(
    () => createPreviewLevelProgressUiData(previewState, previewLevelSuffix),
    [previewLevelSuffix, previewState],
  );

  const stagePanel = useMemo(
    () => (previewPageConfig ? findStagePanel(previewPageConfig) : null),
    [previewPageConfig],
  );
  const previewUser: UiPreviewUser = getUiPreviewUser("player");

  const resetSaveFeedback = () => {
    setSaveMessage("");
    setSaveError("");
  };

  const handleOpenBackgroundEditor = () => {
    resetSaveFeedback();
    void getLevelStageDecorationFromStore().then((decoration) => {
      setDraftDecoration(decoration);
      setActiveEditor("background");
    });
  };

  const handleOpenButtonFormatEditor = () => {
    resetSaveFeedback();
    setDraftButtonFormat(getLevelNodeButtonFormatFromStore());
    setActiveEditor("buttonFormat");
  };

  const handleOpenPathEditor = () => {
    resetSaveFeedback();
    setDraftPathDesign(getLevelMapPathDesignFromStore());
    setSelectedEdgeId(null);
    setPathConnectFrom(null);
    setActiveEditor("pathDesign");
  };

  const handleSaveBackground = async () => {
    resetSaveFeedback();
    setSavingBackground(true);

    try {
      await syncLevelStageBackground(normalizeLevelStageDecoration(draftDecoration));
      const nextPageConfig = getPageConfig(LEVEL_MAP_PAGE_ID);
      setPageConfig(nextPageConfig);
      const savedDecoration = await getLevelStageDecorationFromStore();
      setDraftDecoration(savedDecoration);
      setSaveMessage("背景已保存，并同步到各端主界面的关卡路径地图。");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存背景失败。");
    } finally {
      setSavingBackground(false);
    }
  };

  const handleSaveButtonFormat = () => {
    resetSaveFeedback();
    setSavingButtonFormat(true);

    try {
      syncLevelNodeButtonFormat(draftButtonFormat);
      const nextPageConfig = getPageConfig(LEVEL_MAP_PAGE_ID);
      setPageConfig(nextPageConfig);
      setDraftButtonFormat(getLevelNodeButtonFormatFromStore());
      setSaveMessage("按钮格式已保存，并同步到各端主界面的关卡路径地图。");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存按钮格式失败。");
    } finally {
      setSavingButtonFormat(false);
    }
  };

  const handleLevelButtonPositionChange = (levelSuffix: string, position: ComponentPosition) => {
    setPageConfig((current) => {
      if (!current) {
        return current;
      }

      return updateLevelNodeButtonPositionInPage(current, levelSuffix, position);
    });
  };

  const handleSaveLayout = () => {
    if (!pageConfig) {
      return;
    }

    resetSaveFeedback();
    setSavingLayout(true);

    try {
      syncLevelNodeButtonLayout(extractLevelNodeButtonLayouts(pageConfig));
      setPageConfig(getPageConfig(LEVEL_MAP_PAGE_ID));
      setSaveMessage("按钮布局已保存，并同步到各端主界面的关卡路径地图。");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存按钮布局失败。");
    } finally {
      setSavingLayout(false);
    }
  };

  const handleSavePathDesign = () => {
    resetSaveFeedback();
    setSavingPathDesign(true);

    try {
      syncLevelMapPathDesign(draftPathDesign);
      setPageConfig(getPageConfig(LEVEL_MAP_PAGE_ID));
      setDraftPathDesign(getLevelMapPathDesignFromStore());
      setPathConnectFrom(null);
      setSaveMessage("路径已保存，并同步到各端主界面的关卡路径地图。");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "保存路径失败。");
    } finally {
      setSavingPathDesign(false);
    }
  };

  const handleConnectNode = useCallback((levelSuffix: string) => {
    if (pathConnectFrom === null) {
      return;
    }

    if (!pathConnectFrom) {
      setPathConnectFrom(levelSuffix);
      return;
    }

    if (pathConnectFrom === levelSuffix) {
      setPathConnectFrom("");
      return;
    }

    const nextEdge = createLevelMapPathEdge(pathConnectFrom, levelSuffix, draftPathDesign.edges);
    if (nextEdge) {
      setDraftPathDesign({ edges: [...draftPathDesign.edges, nextEdge] });
      setSelectedEdgeId(nextEdge.id);
    }
    setPathConnectFrom("");
  }, [draftPathDesign, pathConnectFrom]);

  const pathEdit = useMemo((): LevelMapPathEditContext | undefined => {
    if (activeEditor !== "pathDesign") {
      return undefined;
    }

    return {
      enabled: true,
      selectedEdgeId,
      connectFromSuffix: pathConnectFrom,
      onSelectEdge: setSelectedEdgeId,
      onConnectNode: handleConnectNode,
    };
  }, [activeEditor, handleConnectNode, pathConnectFrom, selectedEdgeId]);

  return (
    <section className="level-interface-shell page-builder-shell">
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Level Interface</p>
          <h2>关卡界面优化</h2>
          <p className="panel-copy">
            各端共用同一张关卡路径地图。可分别优化背景、按钮格式、节点布局与关卡路径；按钮会根据玩家进度自动切换「未解锁 / 未通关 / 已通关」文案。
          </p>
        </div>
        <div className="actions">
          <button type="button" onClick={handleOpenButtonFormatEditor}>
            按钮格式设置
          </button>
          <button type="button" onClick={handleOpenPathEditor}>
            路径设置
          </button>
          <button type="button" onClick={handleOpenBackgroundEditor}>
            优化背景
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onNavigate("/director_console/level_background_templates")}
          >
            关卡背景模板
          </button>
          <button type="button" className="secondary" onClick={onBack}>
            返回总监工作台
          </button>
        </div>
      </div>

      {!pageConfig ? (
        <p className="feedback error">未找到共享关卡地图配置：{LEVEL_MAP_PAGE_ID}</p>
      ) : null}

      {!stagePanel ? (
        <p className="feedback error">关卡路径地图缺少 stage 面板，无法预览。</p>
      ) : null}

      {activeEditor === "background" ? (
        <LevelStageBackgroundEditor
          userId={userId}
          decoration={draftDecoration}
          onChange={setDraftDecoration}
          onSave={() => {
            void handleSaveBackground();
          }}
          onClose={() => setActiveEditor(null)}
          saveMessage={saveMessage}
          saveError={saveError}
          savingBackground={savingBackground}
        />
      ) : null}

      {activeEditor === "buttonFormat" ? (
        <LevelNodeButtonFormatEditor
          userId={userId}
          format={draftButtonFormat}
          onChange={setDraftButtonFormat}
          previewState={previewState}
          onPreviewStateChange={setPreviewState}
          previewLevelSuffix={previewLevelSuffix}
          onPreviewLevelSuffixChange={setPreviewLevelSuffix}
          onSave={handleSaveButtonFormat}
          onClose={() => setActiveEditor(null)}
          saveMessage={saveMessage}
          saveError={saveError}
          saving={savingButtonFormat}
        />
      ) : null}

      {activeEditor === "pathDesign" ? (
        <LevelMapPathEditor
          pathDesign={draftPathDesign}
          onChange={setDraftPathDesign}
          selectedEdgeId={selectedEdgeId}
          onSelectedEdgeIdChange={setSelectedEdgeId}
          connectFromSuffix={pathConnectFrom}
          onConnectFromSuffixChange={setPathConnectFrom}
          onSave={handleSavePathDesign}
          onClose={() => {
            setActiveEditor(null);
            setPathConnectFrom(null);
          }}
          saveMessage={saveMessage}
          saveError={saveError}
          saving={savingPathDesign}
        />
      ) : null}

      {previewPageConfig && stagePanel ? (
        <>
          <div className="page-builder-preview-meta">
            <div>
              <span>共享地图</span>
              <strong>{previewPageConfig.name}</strong>
              <code>{previewPageConfig.id}</code>
            </div>
            <div>
              <span>关卡节点</span>
              <strong>{countLevelNodes(stagePanel)} 个</strong>
              <code>三态文案：未解锁 / 未通关 / 已通关</code>
            </div>
          </div>

          <section className="page-builder-canvas-panel level-interface-preview-panel">
            <div className="page-builder-editor-actions level-interface-preview-actions">
              <div className="level-interface-preview-actions-main">
                <span>关卡路径地图预览</span>
                <span>测试账号 {previewUser.nickname}</span>
              </div>
              <div className="level-interface-preview-actions-controls">
                <button
                  type="button"
                  onClick={handleSaveLayout}
                  disabled={savingLayout}
                >
                  {savingLayout ? "保存中..." : "保存按钮布局"}
                </button>
              </div>
            </div>
            <div className="level-interface-preview-state-controls">
              <span>预览样式</span>
              <div className="level-interface-button-format-preview-tabs">
                {LEVEL_NODE_PROGRESS_STATE_META.map((state) => (
                  <button
                    key={state.id}
                    type="button"
                    className={previewState === state.id ? "active" : "secondary"}
                    onClick={() => setPreviewState(state.id)}
                  >
                    {state.name}
                  </button>
                ))}
              </div>
              <label className="level-interface-preview-level-select">
                <span>示例关卡</span>
                <select
                  value={previewLevelSuffix}
                  onChange={(event) => setPreviewLevelSuffix(event.target.value)}
                >
                  {LEVEL_NODE_DEFINITIONS.map((level) => (
                    <option key={level.suffix} value={level.suffix}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="level-interface-layout-hint panel-copy">
              {activeEditor === "pathDesign"
                ? "路径编辑模式：点击路径选中连接，或使用「添加连接」在预览中依次点击两个关卡节点。"
                : "预览会显示当前背景、路径与按钮样式。点击节点选中后可拖动调整位置，四角可调整大小；不会跳转到关卡页面。"}
            </p>
            {saveMessage ? <p className="feedback success">{saveMessage}</p> : null}
            {saveError ? <p className="feedback error">{saveError}</p> : null}
            <div className="page-builder-render-surface page-builder-actual-preview-surface level-interface-map-preview-surface">
              <div className="page-builder-dynamic-page-frame">
                <LevelMapLayoutPreview
                  page={previewPageConfig}
                  previewUser={previewUser}
                  previewUiData={previewUiData}
                  selectedLevelSuffix={selectedLevelSuffix}
                  onSelectedLevelSuffixChange={setSelectedLevelSuffix}
                  onLevelButtonPositionChange={handleLevelButtonPositionChange}
                  pathEdit={pathEdit}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
};
