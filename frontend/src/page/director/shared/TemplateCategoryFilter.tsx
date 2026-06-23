type TemplateCategoryFilterProps<T extends string> = {
  categories: ReadonlyArray<{ id: T; label: string }>;
  activeCategory: T | "all";
  onChange: (category: T | "all") => void;
};

export const TemplateCategoryFilter = <T extends string>({
  categories,
  activeCategory,
  onChange,
}: TemplateCategoryFilterProps<T>) => (
  <div className="template-category-filter">
    <button
      type="button"
      className={`template-category-filter-item${activeCategory === "all" ? " active" : ""}`}
      onClick={() => onChange("all")}
    >
      全部
    </button>
    {categories.map((category) => (
      <button
        key={category.id}
        type="button"
        className={`template-category-filter-item${activeCategory === category.id ? " active" : ""}`}
        onClick={() => onChange(category.id)}
      >
        {category.label}
      </button>
    ))}
  </div>
);
