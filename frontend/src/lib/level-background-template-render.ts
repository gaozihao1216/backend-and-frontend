import type { CSSProperties } from "react";
import { toStretchVisualDesign } from "./director-template-select.js";
import type { LevelBackgroundTemplate } from "../objects/level/level-background-template.js";
import type { StretchVisualDesign } from "../objects/ui-customization/ui-customization-objects.js";
import type { StretchVisualTemplate } from "../objects/ui/stretch_template/stretch-visual-template.js";
import { loadVisualAsset } from "./ui-visual-asset-store.js";

const DEFAULT_CLOUD_FRAME: NonNullable<StretchVisualDesign["frame"]> = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export const resolveLevelBackgroundPanelDesign = (
  template: LevelBackgroundTemplate,
  panelTemplates: Map<string, StretchVisualTemplate>,
): StretchVisualDesign | null => {
  const design = template.panelBackgroundDesign;
  if (!design) {
    return null;
  }

  const libraryTemplate = panelTemplates.get(design.templateId);
  const sourceDataUrl = design.sourceDataUrl ?? libraryTemplate?.sourceDataUrl;
  if (!sourceDataUrl) {
    return null;
  }

  return {
    templateId: design.templateId,
    sourceDataUrl,
    ...(design.frame ? { frame: design.frame } : {}),
  };
};

export const resolveLevelBackgroundCloudDesigns = (
  template: LevelBackgroundTemplate,
  patternTemplates: Map<string, StretchVisualTemplate>,
): StretchVisualDesign[] =>
  template.cloudPatternDesigns.flatMap((design) => {
    const libraryTemplate = patternTemplates.get(design.templateId);
    const sourceDataUrl = design.sourceDataUrl ?? libraryTemplate?.sourceDataUrl;
    if (!sourceDataUrl) {
      return [];
    }

    return [{
      templateId: design.templateId,
      sourceDataUrl,
      frame: design.frame ?? DEFAULT_CLOUD_FRAME,
    }];
  });

const resolveStretchVisualDesignSource = async (
  design: StretchVisualDesign,
  libraryTemplate: StretchVisualTemplate | undefined,
  defaultFrame?: StretchVisualDesign["frame"],
): Promise<StretchVisualDesign | null> => {
  const sourceDataUrl = design.sourceDataUrl
    ?? libraryTemplate?.sourceDataUrl
    ?? await loadVisualAsset(design.templateId)
    ?? undefined;

  if (!sourceDataUrl) {
    return null;
  }

  const frame = design.frame ?? defaultFrame;

  return {
    templateId: design.templateId,
    sourceDataUrl,
    ...(frame ? { frame } : {}),
  };
};

export const resolveLevelBackgroundDesignsForRender = async (
  template: LevelBackgroundTemplate,
  panelTemplates: Map<string, StretchVisualTemplate>,
  patternTemplates: Map<string, StretchVisualTemplate>,
): Promise<{
  panelBackgroundDesign: StretchVisualDesign | null;
  cloudPatternDesigns: StretchVisualDesign[];
}> => {
  let panelBackgroundDesign: StretchVisualDesign | null = null;
  if (template.panelBackgroundDesign) {
    panelBackgroundDesign = await resolveStretchVisualDesignSource(
      template.panelBackgroundDesign,
      panelTemplates.get(template.panelBackgroundDesign.templateId),
    );
  }

  const cloudPatternDesigns = (
    await Promise.all(
      template.cloudPatternDesigns.map((design) =>
        resolveStretchVisualDesignSource(
          design,
          patternTemplates.get(design.templateId),
          DEFAULT_CLOUD_FRAME,
        ),
      ),
    )
  ).filter((design): design is StretchVisualDesign => design !== null);

  return { panelBackgroundDesign, cloudPatternDesigns };
};

export const createPanelBackgroundDesignFromTemplate = (
  template: StretchVisualTemplate,
): StretchVisualDesign => ({
  templateId: template.id,
  sourceDataUrl: template.sourceDataUrl,
});

export const createCloudPatternDesignFromTemplate = (
  template: StretchVisualTemplate,
): StretchVisualDesign => toStretchVisualDesign(template, DEFAULT_CLOUD_FRAME);

export const toggleCloudPatternDesign = (
  designs: StretchVisualDesign[],
  template: StretchVisualTemplate,
  enabled: boolean,
): StretchVisualDesign[] => {
  if (!enabled) {
    return designs.filter((design) => design.templateId !== template.id);
  }

  if (designs.some((design) => design.templateId === template.id)) {
    return designs;
  }

  return [...designs, createCloudPatternDesignFromTemplate(template)];
};

export const getLevelBackgroundGradientStyle = (
  template: LevelBackgroundTemplate,
): CSSProperties => ({
  background: `linear-gradient(180deg, ${template.skyTopColor} 0%, ${template.skyBottomColor} 72%, ${template.horizonColor} 100%)`,
});

export type LevelBackgroundCloudSprite = {
  id: string;
  designIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
};

export const createLevelBackgroundCloudSprites = (
  width: number,
  height: number,
  density: number,
  designCount: number,
): LevelBackgroundCloudSprite[] =>
  Array.from({ length: density }, (_, index) => ({
    id: `cloud-${index}-${Math.random().toString(36).slice(2, 8)}`,
    designIndex: designCount > 0 ? index % designCount : 0,
    x: (width / Math.max(density, 1)) * index + Math.random() * 80,
    y: height * (0.06 + Math.random() * 0.2),
    width: 72 + Math.random() * 96,
    height: 36 + Math.random() * 42,
    speed: 0.25 + Math.random() * 0.45,
    opacity: 0.72 + Math.random() * 0.24,
  }));
