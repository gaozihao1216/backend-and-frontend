import type { CSSProperties, PointerEvent } from "react";
import type { ButtonBaseDesign } from "../../objects/ui-customization/ui-customization-objects.js";
import { useProcessedTemplateImage } from "../../page/shared/hooks/useProcessedTemplateImage.js";
import { getButtonBaseDesignStyle } from "./ui-renderer-utils.js";

type ProcessedTemplateImageProps = {
  sourceDataUrl: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

export const ProcessedTemplateImage = ({
  sourceDataUrl,
  alt = "",
  className,
  style,
}: ProcessedTemplateImageProps) => {
  const processedUrl = useProcessedTemplateImage(sourceDataUrl);

  return (
    <img
      src={processedUrl || sourceDataUrl}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
    />
  );
};

type ProcessedTemplateBackgroundProps = {
  sourceDataUrl: string;
  className?: string;
  style?: CSSProperties;
  onPointerDown?: (event: PointerEvent<HTMLSpanElement>) => void;
};

export const ProcessedTemplateBackground = ({
  sourceDataUrl,
  className,
  style,
  onPointerDown,
}: ProcessedTemplateBackgroundProps) => {
  const processedUrl = useProcessedTemplateImage(sourceDataUrl);

  return (
    <span
      className={className}
      style={{
        ...style,
        backgroundImage: processedUrl ? `url("${processedUrl}")` : undefined,
      }}
      onPointerDown={onPointerDown}
    />
  );
};

type ProcessedTemplateBaseProps = {
  baseDesign: ButtonBaseDesign;
  className?: string;
};

export const ProcessedTemplateBase = ({
  baseDesign,
  className = "dynamic-ui-button-base",
}: ProcessedTemplateBaseProps) => {
  const processedUrl = useProcessedTemplateImage(baseDesign.sourceDataUrl);
  const resolvedDesign = {
    ...baseDesign,
    sourceDataUrl: processedUrl || baseDesign.sourceDataUrl,
  };

  return (
    <span
      className={className}
      style={getButtonBaseDesignStyle(resolvedDesign)}
      aria-hidden="true"
    >
      {baseDesign.scalingMode === "fixedAspect" ? (
        <img src={resolvedDesign.sourceDataUrl} alt="" draggable={false} />
      ) : null}
    </span>
  );
};
