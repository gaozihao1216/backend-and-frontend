import type { TextComponent } from "../../objects/ui-customization/ui-customization-objects.js";
import {
  getPanelTextArtContainerClassName,
  getPanelTextArtContainerStyle,
  getPanelTextArtContentClassName,
  getPanelTextArtContentStyle,
  isArtTextPreset,
  resolveTextArtDesign,
} from "../../lib/art-text-styles.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle, interpolatePreviewText } from "./ui-renderer-utils.js";

type DynamicTextProps = {
  text: TextComponent;
  context: DynamicRendererContext;
};

export const DynamicText = ({ text, context }: DynamicTextProps) => {
  const content = interpolatePreviewText(text.text, context.previewUser);
  const artTextDesign = text.artTextDesign;
  const preset = resolveTextArtDesign(artTextDesign).preset;
  const usesArtText = isArtTextPreset(preset);

  return (
    <div
      className={`dynamic-ui-text ${getPanelTextArtContainerClassName(artTextDesign)}`.trim()}
      style={{
        ...getPositionStyle(text.position),
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
