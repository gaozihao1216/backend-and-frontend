import { LevelMapPathEditor } from "./components/LevelMapPathEditor.js";
import { LevelNodeButtonFormatEditor } from "./components/LevelNodeButtonFormatEditor.js";
import { LevelStageBackgroundEditor } from "./components/LevelStageBackgroundEditor.js";
import { DirectorLevelInterfacePreviewPanel } from "./components/DirectorLevelInterfacePreviewPanel.js";
import { DirectorLevelInterfaceToolbar } from "./components/DirectorLevelInterfaceToolbar.js";
import { useDirectorLevelInterface } from "./hooks/useDirectorLevelInterface.js";
import { countLevelNodes, LEVEL_MAP_PAGE_ID } from "../../../lib/level-stage-structure.js";

type DirectorLevelInterfacePageProps = {
  userId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
};

export const DirectorLevelInterfacePage = ({ userId, onBack, onNavigate }: DirectorLevelInterfacePageProps) => {
  const levelInterface = useDirectorLevelInterface(userId);

  return (
    <section className="level-interface-shell page-builder-shell">
      <DirectorLevelInterfaceToolbar
        onOpenButtonFormatEditor={levelInterface.handleOpenButtonFormatEditor}
        onOpenPathEditor={levelInterface.handleOpenPathEditor}
        onOpenBackgroundEditor={levelInterface.handleOpenBackgroundEditor}
        onOpenBackgroundTemplates={() => onNavigate("/director_console/level_background_templates")}
        onBack={onBack}
      />

      {!levelInterface.pageConfig ? (
        <p className="feedback error">未找到共享关卡地图配置：{LEVEL_MAP_PAGE_ID}</p>
      ) : null}

      {!levelInterface.stagePanel ? (
        <p className="feedback error">关卡路径地图缺少 stage 面板，无法预览。</p>
      ) : null}

      {levelInterface.activeEditor === "background" ? (
        <LevelStageBackgroundEditor
          userId={userId}
          decoration={levelInterface.draftDecoration}
          onChange={levelInterface.setDraftDecoration}
          onSave={() => {
            void levelInterface.handleSaveBackground();
          }}
          onClose={() => levelInterface.setActiveEditor(null)}
          saveMessage={levelInterface.saveMessage}
          saveError={levelInterface.saveError}
          savingBackground={levelInterface.savingBackground}
        />
      ) : null}

      {levelInterface.activeEditor === "buttonFormat" ? (
        <LevelNodeButtonFormatEditor
          userId={userId}
          format={levelInterface.draftButtonFormat}
          onChange={levelInterface.setDraftButtonFormat}
          previewState={levelInterface.previewState}
          onPreviewStateChange={levelInterface.setPreviewState}
          previewLevelSuffix={levelInterface.previewLevelSuffix}
          onPreviewLevelSuffixChange={levelInterface.setPreviewLevelSuffix}
          onSave={levelInterface.handleSaveButtonFormat}
          onClose={() => levelInterface.setActiveEditor(null)}
          saveMessage={levelInterface.saveMessage}
          saveError={levelInterface.saveError}
          saving={levelInterface.savingButtonFormat}
        />
      ) : null}

      {levelInterface.activeEditor === "pathDesign" ? (
        <LevelMapPathEditor
          pathDesign={levelInterface.draftPathDesign}
          onChange={levelInterface.setDraftPathDesign}
          selectedEdgeId={levelInterface.selectedEdgeId}
          onSelectedEdgeIdChange={levelInterface.setSelectedEdgeId}
          connectFromSuffix={levelInterface.pathConnectFrom}
          onConnectFromSuffixChange={levelInterface.setPathConnectFrom}
          onSave={levelInterface.handleSavePathDesign}
          onClose={levelInterface.closePathEditor}
          saveMessage={levelInterface.saveMessage}
          saveError={levelInterface.saveError}
          saving={levelInterface.savingPathDesign}
        />
      ) : null}

      {levelInterface.previewPageConfig && levelInterface.stagePanel ? (
        <DirectorLevelInterfacePreviewPanel
          previewPageConfig={levelInterface.previewPageConfig}
          previewUser={levelInterface.previewUser}
          previewUiData={levelInterface.previewUiData}
          levelNodeCount={countLevelNodes(levelInterface.stagePanel)}
          activeEditor={levelInterface.activeEditor}
          previewState={levelInterface.previewState}
          onPreviewStateChange={levelInterface.setPreviewState}
          previewLevelSuffix={levelInterface.previewLevelSuffix}
          onPreviewLevelSuffixChange={levelInterface.setPreviewLevelSuffix}
          selectedLevelSuffix={levelInterface.selectedLevelSuffix}
          onSelectedLevelSuffixChange={levelInterface.setSelectedLevelSuffix}
          onLevelButtonPositionChange={levelInterface.handleLevelButtonPositionChange}
          pathEdit={levelInterface.pathEdit}
          savingLayout={levelInterface.savingLayout}
          onSaveLayout={levelInterface.handleSaveLayout}
          saveMessage={levelInterface.saveMessage}
          saveError={levelInterface.saveError}
        />
      ) : null}
    </section>
  );
};
