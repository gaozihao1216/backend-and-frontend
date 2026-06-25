import type { UiButtonTemplate } from "../../../../objects/api/api-contracts.js";
import { TemplateCategoryFilter } from "../../shared/TemplateCategoryFilter.js";
import { PageFeedback } from "../../../player/shared/PageFeedback.js";
import {
  BUTTON_TEMPLATE_CATEGORIES,
  getButtonTemplateCategoryLabel,
  normalizeButtonTemplateCategory,
  type ButtonTemplateCategory,
} from "../../../../objects/ui/category/template-category.js";

type ButtonTemplateListSectionProps = {
  templates: UiButtonTemplate[];
  loading: boolean;
  message: string;
  error: string;
  categoryFilter: ButtonTemplateCategory | "all";
  onCategoryFilterChange: (category: ButtonTemplateCategory | "all") => void;
  onCreate: () => void;
  onEdit: (template: UiButtonTemplate) => void;
  onDelete: (template: UiButtonTemplate) => void;
};

export const ButtonTemplateListSection = ({
  templates,
  loading,
  message,
  error,
  categoryFilter,
  onCategoryFilterChange,
  onCreate,
  onEdit,
  onDelete,
}: ButtonTemplateListSectionProps) => (
  <>
    <PageFeedback error={error} notice={message} />

    <TemplateCategoryFilter
      categories={BUTTON_TEMPLATE_CATEGORIES}
      activeCategory={categoryFilter}
      onChange={onCategoryFilterChange}
    />

    {loading ? (
      <p className="meta">正在读取按钮模板...</p>
    ) : templates.length > 0 ? (
      <div className="button-template-grid">
        {templates.map((template) => (
          <article key={template.id} className="button-template-card">
            <div className="button-template-preview">
              <img src={template.sourceDataUrl} alt={template.name} />
            </div>
            <div className="button-template-card-body">
              <div>
                <strong>{template.name}</strong>
                <p className="meta">{template.id}</p>
                <p className="template-category-badge">
                  {getButtonTemplateCategoryLabel(normalizeButtonTemplateCategory(template.category))}
                </p>
                <p className="meta">{template.scalingMode === "nineSlice" ? "可压缩模板" : "不可压缩模板"}</p>
              </div>
              <div className="button-template-card-actions">
                <button type="button" className="secondary" onClick={() => onEdit(template)}>
                  修改
                </button>
                <button type="button" className="secondary danger" onClick={() => void onDelete(template)}>
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <section className="button-template-empty">
        <p>暂无按钮模板。</p>
        <button type="button" onClick={onCreate}>
          新增第一个模板
        </button>
      </section>
    )}
  </>
);
