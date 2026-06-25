import type { TextComponent } from "../../../../objects/ui-customization/ui-customization-objects.js";
import {
  getPanelTextArtContainerClassName,
  getPanelTextArtContainerStyle,
  getPanelTextArtContentClassName,
  getPanelTextArtContentStyle,
  isArtTextPreset,
  resolveTextArtDesign,
} from "../../function/ui-design/art-text-styles.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle } from "./ui-renderer-utils.js";
import { resolveTextComponentContent } from "../../function/ui-design/dynamic-text-program.js";

type DynamicTextProps = {
  text: TextComponent;
  context: DynamicRendererContext;
};

export const DynamicText = ({ text, context }: DynamicTextProps) => {
  const content = resolveTextComponentContent(
    text,
    context.previewUser,
    context.uiRuntime?.uiData,
  );
  const artTextDesign = text.artTextDesign;
  const preset = resolveTextArtDesign(artTextDesign).preset;
  const usesArtText = isArtTextPreset(preset);

  return (
    <div
      className={`dynamic-ui-text ${getPanelTextArtContainerClassName(artTextDesign)}`.trim()}
      style={{
        ...getPositionStyle(text.position, context.layoutType),
        ...getComponentStyle(text.style),
        ...getPanelTextArtContainerStyle(artTextDesign),
      }}
    >
      {usesArtText ? (
        <span
          className={getPanelTextArtContentClassName(artTextDesign)}
          style={getPanelTextArtContentStyle(artTextDesign)}
        >
          {content}
        </span>
      ) : content}
    </div>
  );
};
