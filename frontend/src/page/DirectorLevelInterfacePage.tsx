import { useEffect, useMemo, useState } from "react";
import { LevelNodeButtonFormatEditor } from "../component/director/LevelNodeButtonFormatEditor.js";
import { LevelStageBackgroundEditor } from "../component/director/LevelStageBackgroundEditor.js";
import { DynamicPageRenderer } from "../component/ui-renderer/index.js";
import { getPageConfig } from "../lib/ui-customization.js";
import {
  applyLevelNodeButtonFormat,
  createPreviewLevelProgressUiData,
  getLevelNodeButtonFormatFromStore,
  syncLevelNodeButtonFormat,
  type LevelNodeButtonFormatSettings,
  type LevelNodeProgressStateId,
} from "../lib/level-node-button-format.js";
import {
  applyLevelStageDecoration,
  getDefaultLevelStageDecoration,
  getLevelStageDecorationFromStore,
  syncLevelStageBackground,
} from "../lib/level-stage-background.js";
import {
  countLevelNodes,
  findStagePanel,
  LEVEL_MAP_PAGE_ID,
} from "../lib/level-stage-structure.js";
import { LEVEL_NODE_DEFINITIONS } from "../objects/ui-customization/level-map-structure.js";
import type { PageConfig, PanelDecoration } from "../objects/ui-customization/ui-customization-objects.js";
import { getUiPreviewUser } from "../objects/ui-customization/ui-customization-objects.js";

type DirectorLevelInterfacePageProps = {
  userId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
};

type ActiveEditor = "background" | "buttonFormat" | null;

export const DirectorLevelInterfacePage = ({ userId, onBack, onNavigate }: DirectorLevelInterfacePageProps) => {
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => getPageConfig(LEVEL_MAP_PAGE_ID));
  const [activeEditor, setActiveEditor] = useState<ActiveEditor>(null);
  const [draftDecoration, setDraftDecoration] = useState<PanelDecoration>(() => getDefaultLevelStageDecoration());
  const [draftButtonFormat, setDraftButtonFormat] = useState<LevelNodeButtonFormatSettings>(
    () => getLevelNodeButtonFormatFromStore(),
  );
  const [previewState, setPreviewState] = useState<LevelNodeProgressStateId>("notCleared");
  const [previewLevelSuffix, setPreviewLevelSuffix] = useState(LEVEL_NODE_DEFINITIONS[0]?.suffix ?? "level01");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingBackground, setSavingBackground] = useState(false);
  const [savingButtonFormat, setSavingButtonFormat] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getLevelStageDecorationFromStore().then((decoration) => {
      if (!cancelled) {
        setPageConfig(getPageConfig(LEVEL_MAP_PAGE_ID));
        setDraftDecoration(decoration);
        setDraftButtonFormat(getLevelNodeButtonFormatFromStore());
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const previewPageConfig = useMemo(() => {
    if (!pageConfig) {
      return null;
    }

    return applyLevelNodeButtonFormat(
      applyLevelStageDecoration(pageConfig, draftDecoration),
      draftButtonFormat,
    );
  }, [draftButtonFormat, draftDecoration, pageConfig]);

  const previewUiData = useMemo(
    () => createPreviewLevelProgressUiData(previewState, previewLevelSuffix),
    [previewLevelSuffix, previewState],
  );

  const stagePanel = useMemo(
    () => (previewPageConfig ? findStagePanel(previewPageConfig) : null),
    [previewPageConfig],
  );
  const previewUser = getUiPreviewUser("player");

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

  const handleSaveBackground = async () => {
    resetSaveFeedback();
    setSavingBackground(true);

    try {
      await syncLevelStageBackground(draftDecoration);
      setPageConfig(getPageConfig(LEVEL_MAP_PAGE_ID));
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

  return (
    <section className="level-interface-shell page-builder-shell">
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Level Interface</p>
          <h2>关卡界面优化</h2>
          <p className="panel-copy">
            各端共用同一张关卡路径地图。可分别优化背景与按钮格式；按钮会根据玩家进度自动切换「未解锁 / 未通关 / 已通关」文案。
          </p>
        </div>
        <div className="actions">
          <button type="button" onClick={handleOpenButtonFormatEditor}>
            按钮格式设置
          </button>
          <button type="button" onClick={handleOpenBackgroundEditor}>
            优化背景
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
            <div className="page-builder-editor-actions">
              <span>关卡路径地图预览</span>
              <span>测试账号 {previewUser.nickname}</span>
            </div>
            <div className="page-builder-render-surface page-builder-actual-preview-surface">
              <div className="page-builder-dynamic-page-frame">
                <DynamicPageRenderer
                  page={previewPageConfig}
                  previewUser={previewUser}
                  previewUiData={previewUiData}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
};
