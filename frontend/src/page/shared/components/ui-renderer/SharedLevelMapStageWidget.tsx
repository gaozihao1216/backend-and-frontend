import { useSyncExternalStore } from "react";
import { useSharedLevelMapPageConfig } from "../../hooks/level-map/useSharedLevelMapPageConfig.js";
import { findStagePanel } from "../../function/level-map/level-stage-structure.js";
import { getPageConfigRevision, subscribePageConfigStore } from "../../function/ui-config/ui-customization.js";
import { getUiPreviewUser } from "../../../../objects/ui-customization/ui-customization-objects.js";
import { SharedLevelMapRenderer } from "./SharedLevelMapRenderer.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle } from "./ui-renderer-utils.js";
import type { WidgetComponent } from "../../../../objects/ui-customization/ui-customization-objects.js";

type SharedLevelMapStageWidgetProps = {
  widget: WidgetComponent;
  context: DynamicRendererContext;
};

const getStageDecorationKey = (page: NonNullable<ReturnType<typeof useSharedLevelMapPageConfig>>): string =>
  JSON.stringify(findStagePanel(page)?.decoration ?? null);

export const SharedLevelMapStageWidget = ({ widget, context }: SharedLevelMapStageWidgetProps) => {
  const pageConfigRevision = useSyncExternalStore(
    subscribePageConfigStore,
    getPageConfigRevision,
    getPageConfigRevision,
  );
  const page = useSharedLevelMapPageConfig();
  const previewUser = getUiPreviewUser("player");

  const style = {
    ...getPositionStyle(widget.position, context.layoutType),
    ...getComponentStyle(widget.style),
  };

  if (!page) {
    return (
      <div className="dynamic-ui-widget shared-level-map-stage-widget" style={style}>
        <p className="feedback error">未找到共享关卡地图配置。</p>
      </div>
    );
  }

  return (
    <div className="dynamic-ui-widget shared-level-map-stage-widget" style={style}>
      <SharedLevelMapRenderer
        key={`${pageConfigRevision}:${getStageDecorationKey(page)}`}
        page={page}
        previewUser={previewUser}
        runtimeUserId={context.runtimeUserId}
        onNavigate={context.onNavigate}
      />
    </div>
  );
};
