import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { LevelMapPathEditContext } from "../../../../components/ui-renderer/ui-renderer-types.js";
import { getPageConfig, getPageConfigRevision, subscribePageConfigStore } from "../../../../lib/ui-customization.js";
import { setSharedLevelMapPersistenceUser } from "../../../../lib/shared-level-map-persistence.js";
import {
  applyLevelNodeButtonFormat,
  createPreviewLevelProgressUiData,
  getLevelNodeButtonFormatFromStore,
  syncLevelNodeButtonFormat,
  type LevelNodeButtonFormatSettings,
  type LevelNodeProgressStateId,
} from "../../../../lib/level-node-button-format.js";
import {
  applyLevelStageDecoration,
  getDefaultLevelStageDecoration,
  getLevelStageDecorationFromStore,
  normalizeLevelStageDecoration,
  syncLevelStageBackground,
} from "../../../../lib/level-stage-background.js";
import {
  extractLevelNodeButtonLayouts,
  syncLevelNodeButtonLayout,
  updateLevelNodeButtonPositionInPage,
} from "../../../../lib/level-node-button-layout.js";
import {
  applyLevelMapPathDesign,
  createLevelMapPathEdge,
  getLevelMapPathDesignFromStore,
  syncLevelMapPathDesign,
} from "../../../../lib/level-map-path.js";
import type { LevelMapPathDesign } from "../../../../objects/ui-customization/ui-customization-objects.js";
import {
  countLevelNodes,
  findStagePanel,
  LEVEL_MAP_PAGE_ID,
} from "../../../../lib/level-stage-structure.js";
import { LEVEL_NODE_DEFINITIONS } from "../../../../objects/ui-customization/level-map-structure.js";
import type { ComponentPosition, PageConfig, PanelDecoration } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { getUiPreviewUser } from "../../../../objects/ui-customization/ui-customization-objects.js";
import type { LevelInterfaceEditor } from "../objects/level-interface-types.js";

export const useDirectorLevelInterface = (userId: string) => {
  const pageConfigRevision = useSyncExternalStore(
    subscribePageConfigStore,
    getPageConfigRevision,
    getPageConfigRevision,
  );
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(() => getPageConfig(LEVEL_MAP_PAGE_ID));
  const [activeEditor, setActiveEditor] = useState<LevelInterfaceEditor>(null);
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

  const closePathEditor = () => {
    setActiveEditor(null);
    setPathConnectFrom(null);
  };

  return {
    pageConfig,
    activeEditor,
    setActiveEditor,
    draftDecoration,
    setDraftDecoration,
    draftButtonFormat,
    setDraftButtonFormat,
    draftPathDesign,
    setDraftPathDesign,
    previewState,
    setPreviewState,
    previewLevelSuffix,
    setPreviewLevelSuffix,
    saveMessage,
    saveError,
    savingBackground,
    savingButtonFormat,
    savingLayout,
    savingPathDesign,
    selectedLevelSuffix,
    setSelectedLevelSuffix,
    selectedEdgeId,
    setSelectedEdgeId,
    pathConnectFrom,
    setPathConnectFrom,
    previewPageConfig,
    previewUiData,
    stagePanel,
    previewUser,
    pathEdit,
    handleOpenBackgroundEditor,
    handleOpenButtonFormatEditor,
    handleOpenPathEditor,
    handleSaveBackground,
    handleSaveButtonFormat,
    handleSaveLayout,
    handleSavePathDesign,
    handleLevelButtonPositionChange,
    closePathEditor,
  };
};
