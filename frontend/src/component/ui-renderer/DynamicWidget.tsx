import { AdminProposalReviewContent } from "../AdminProposalReviewContent.js";
import type { WidgetComponent } from "../../objects/ui-customization/ui-customization-objects.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import { SharedLevelMapStageWidget } from "./SharedLevelMapStageWidget.js";
import { getComponentStyle, getPositionStyle } from "./ui-renderer-utils.js";

type DynamicWidgetProps = {
  widget: WidgetComponent;
  context: DynamicRendererContext;
};

export const DynamicWidget = ({ widget, context }: DynamicWidgetProps) => {
  const style = {
    ...getPositionStyle(widget.position, context.layoutType),
    ...getComponentStyle(widget.style),
  };

  switch (widget.widgetId) {
    case "adminProposalReview":
      return (
        <div className="dynamic-ui-widget admin-proposal-review-widget" style={style}>
          {context.runtimeUserId ? (
            <AdminProposalReviewContent userId={context.runtimeUserId} embedded />
          ) : (
            <p className="feedback error">需要绑定后端账号后才能加载待审核提案。</p>
          )}
        </div>
      );
    case "levelMapStage":
      return <SharedLevelMapStageWidget widget={widget} context={context} />;
  }
};
