import type { TextComponent } from "../../objects/ui-customization/ui-customization-objects.js";
import type { DynamicRendererContext } from "./ui-renderer-types.js";
import { getComponentStyle, getPositionStyle, interpolatePreviewText } from "./ui-renderer-utils.js";

type DynamicTextProps = {
  text: TextComponent;
  context: DynamicRendererContext;
};

export const DynamicText = ({ text, context }: DynamicTextProps) => {
  const content = interpolatePreviewText(text.text, context.previewUser);

  return (
    <div
      className="dynamic-ui-text"
      style={{
        ...getPositionStyle(text.position),
        ...getComponentStyle(text.style),
      }}
    >
      {content}
    </div>
  );
};
