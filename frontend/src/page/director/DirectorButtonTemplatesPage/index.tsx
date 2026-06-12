import { SimpleStretchTemplateSection } from "../../../component/director/SimpleStretchTemplateSection.js";
import { ButtonTemplateEditorModal } from "../../../component/director-page/ButtonTemplateEditorModal.js";
import { ButtonTemplateListSection } from "../../../component/director-page/ButtonTemplateListSection.js";
import { useDirectorButtonTemplates } from "../../../hook/director-page/useDirectorButtonTemplates.js";
import {
  defaultPanelTemplateDataUrl,
  defaultPatternTemplateDataUrl,
} from "../../../lib/director-page/button-template-draft.js";
import { templateTabs } from "../../../objects/director-page/button-template-types.js";

type DirectorButtonTemplatesPageProps = {
  userId: string;
  onBack: () => void;
};

export const DirectorButtonTemplatesPage = ({ userId, onBack }: DirectorButtonTemplatesPageProps) => {
  const templates = useDirectorButtonTemplates(userId);

  return (
    <section className="panel button-template-page">
      <div className="feature-header">
        <div>
          <h2>模板库</h2>
          <p className="panel-copy">管理按钮、面板与图案模板。按钮模板支持九宫格压缩；面板与图案模板统一采用整体拉伸。</p>
        </div>
        <div className="director-ui-header-actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回 UI 美化配置
          </button>
          {templates.activeTab === "button" ? (
            <button type="button" onClick={templates.openCreateEditor}>
              新增按钮模板
            </button>
          ) : null}
        </div>
      </div>

      <div className="director-template-tabs" role="tablist" aria-label="模板类型">
        {templateTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={templates.activeTab === tab.id}
            className={templates.activeTab === tab.id ? "selected" : ""}
            onClick={() => templates.switchTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {templates.activeTab === "panel" ? (
        <SimpleStretchTemplateSection
          userId={userId}
          kind="panel"
          title="面板模板"
          description="用于面板背景与装饰，统一设为可压缩，采用整体拉伸缩放。"
          idPrefix="panel-template"
          defaultName="新面板模板"
          defaultDataUrl={defaultPanelTemplateDataUrl}
        />
      ) : null}

      {templates.activeTab === "pattern" ? (
        <SimpleStretchTemplateSection
          userId={userId}
          kind="pattern"
          title="图案模板"
          description="用于按钮图案与图标装饰，统一设为可压缩，采用整体拉伸缩放。"
          idPrefix="pattern-template"
          defaultName="新图案模板"
          defaultDataUrl={defaultPatternTemplateDataUrl}
        />
      ) : null}

      {templates.activeTab === "button" ? (
        <>
          <ButtonTemplateListSection
            templates={templates.filteredTemplates}
            loading={templates.loading}
            message={templates.message}
            error={templates.error}
            categoryFilter={templates.categoryFilter}
            onCategoryFilterChange={templates.setCategoryFilter}
            onCreate={templates.openCreateEditor}
            onEdit={templates.openUpdateEditor}
            onDelete={templates.handleDelete}
          />

          {templates.editorMode ? (
            <ButtonTemplateEditorModal
              editorMode={templates.editorMode}
              draft={templates.draft}
              selectedTemplate={templates.selectedTemplate}
              pastedImageValue={templates.pastedImageValue}
              isNineSliceMode={templates.isNineSliceMode}
              previewImageSize={templates.previewImageSize}
              saving={templates.saving}
              saveError={templates.error}
              onDraftChange={(updater) => templates.setDraft(updater)}
              onPastedImageValueChange={templates.setPastedImageValue}
              onImageUpload={templates.handleImageUpload}
              onPasteImage={templates.handlePasteImage}
              onLoadPastedImage={() => void templates.handleLoadPastedImage()}
              onSlicePointerDown={templates.handleSlicePointerDown}
              onSlicePointerMove={templates.handleSlicePointerMove}
              onSlicePointerEnd={templates.handleSlicePointerEnd}
              getVerticalSlicePercent={templates.getVerticalSlicePercent}
              getHorizontalSlicePercent={templates.getHorizontalSlicePercent}
              visibleBoundsStyle={templates.visibleBoundsStyle}
              onClose={templates.closeEditor}
              onSave={() => void templates.handleSave()}
            />
          ) : null}
        </>
      ) : null}
    </section>
  );
};
