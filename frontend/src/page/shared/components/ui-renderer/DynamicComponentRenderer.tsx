import { DynamicButton } from "./DynamicButton.js";
import { DynamicWidget } from "./DynamicWidget.js";
import { DynamicPanel } from "./DynamicPanel.js";
import { DynamicText } from "./DynamicText.js";
import type { DynamicComponentRendererProps } from "./ui-renderer-types.js";

/**
 * 动态组件分发器。
 *
 * PageConfig 中所有组件最终都从这里按 type 分发到具体渲染器；
 * visitedComponentIds 用于防止配置错误导致 panel 子节点递归引用自身。
 */
export const DynamicComponentRenderer = ({
  component,
  context,
  visitedComponentIds = new Set<string>(),
  floating = false,
}: DynamicComponentRendererProps) => {
  if (visitedComponentIds.has(component.id)) {
    return null;
  }

  switch (component.type) {
    case "button":
      return <DynamicButton button={component} context={context} />;
    case "panel":
      return (
        <DynamicPanel
          panel={component}
          context={context}
          visitedComponentIds={visitedComponentIds}
          floating={floating}
        />
      );
    case "text":
      return <DynamicText text={component} context={context} />;
    case "list":
      return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {component.emptyStateText ?? "暂无数据"}
        </div>
      );
    case "widget":
      return <DynamicWidget widget={component} context={context} />;
  }
};
