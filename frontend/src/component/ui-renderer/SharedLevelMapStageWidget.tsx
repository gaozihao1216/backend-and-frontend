import { useMemo, useSyncExternalStore } from "react";
import { getSharedLevelMapStagePageConfig } from "../../lib/level-map-stage-page.js";
import {
  getPageConfigRevision,
  subscribePageConfigStore,
} from "../../lib/ui-customization.js";
import { getUiPreviewUser } from "../../objects/ui-customization/ui-customization-objects.js";
import { DynamicPageRenderer } from "./DynamicPageRenderer.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle } from "./ui-renderer-utils.js";
import type { WidgetComponent } from "../../objects/ui-customization/ui-customization-objects.js";

type SharedLevelMapStageWidgetProps = {
  widget: WidgetComponent;
  context: DynamicRendererContext;
};

export const SharedLevelMapStageWidget = ({ widget, context }: SharedLevelMapStageWidgetProps) => {
  const pageConfigRevision = useSyncExternalStore(
    subscribePageConfigStore,
    getPageConfigRevision,
    getPageConfigRevision,
  );
  const stagePage = useMemo(
    () => getSharedLevelMapStagePageConfig(),
    [pageConfigRevision],
  );
  const previewUser = stagePage ? getUiPreviewUser(stagePage.roleScope) : undefined;

  const style = {
    ...getPositionStyle(widget.position, context.layoutType),
    ...getComponentStyle(widget.style),
  };

  if (!stagePage) {
    return (
      <div className="dynamic-ui-widget shared-level-map-stage-widget" style={style}>
        <p className="feedback error">未找到共享关卡地图配置。</p>
      </div>
    );
  }

  return (
    <div className="dynamic-ui-widget shared-level-map-stage-widget" style={style}>
      <DynamicPageRenderer
        page={stagePage}
        previewUser={previewUser}
        runtimeUserId={context.runtimeUserId}
        onNavigate={context.onNavigate}
        embeddedLevelMapSurface
      />
    </div>
  );
};
