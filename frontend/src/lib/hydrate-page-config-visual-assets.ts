import type {
  ButtonBaseDesign,
  ButtonComponent,
  ButtonStateOption,
  PageComponent,
  PageConfig,
  StretchVisualDesign,
} from "../objects/ui-customization/ui-customization-objects.js";
import {
  hydrateLevelStageDecoration,
  normalizeLevelStageDecoration,
} from "./level-stage-background.js";
import { loadVisualAsset } from "./ui-visual-asset-store.js";

const hydrateStretchVisualDesign = async (
  design: StretchVisualDesign | undefined,
): Promise<StretchVisualDesign | undefined> => {
  if (!design || design.sourceDataUrl) {
    return design;
  }

  const sourceDataUrl = await loadVisualAsset(design.templateId);
  if (!sourceDataUrl) {
    return design;
  }

  return {
    ...design,
    sourceDataUrl,
  };
};

const hydrateButtonBaseDesign = async (
  design: ButtonBaseDesign | undefined,
): Promise<ButtonBaseDesign | undefined> => {
  if (!design || design.sourceDataUrl) {
    return design;
  }

  const sourceDataUrl = await loadVisualAsset(design.templateId);
  if (!sourceDataUrl) {
    return design;
  }

  return {
    ...design,
    sourceDataUrl,
  };
};

const hydrateButtonStateOption = async (state: ButtonStateOption): Promise<ButtonStateOption> => {
  const baseDesign = state.baseDesign ? await hydrateButtonBaseDesign(state.baseDesign) : undefined;
  const patternDesign = state.patternDesign
    ? await hydrateStretchVisualDesign(state.patternDesign)
    : undefined;
  const patternLayers = state.patternLayers
    ? await Promise.all(state.patternLayers.map(async (layer: NonNullable<ButtonStateOption["patternLayers"]>[number]) => ({
        ...layer,
        design: layer.design ? await hydrateStretchVisualDesign(layer.design) : layer.design,
      })))
    : undefined;

  return {
    ...state,
    ...(baseDesign ? { baseDesign } : {}),
    ...(patternDesign ? { patternDesign } : {}),
    ...(patternLayers ? { patternLayers } : {}),
  };
};

const hydrateButtonComponent = async (component: ButtonComponent): Promise<ButtonComponent> => {
  const baseDesign = component.baseDesign
    ? await hydrateButtonBaseDesign(component.baseDesign)
    : undefined;
  const stateDesign = component.stateDesign
    ? {
        ...component.stateDesign,
        states: await Promise.all(component.stateDesign.states.map(hydrateButtonStateOption)),
      }
    : undefined;

  return {
    ...component,
    ...(baseDesign ? { baseDesign } : {}),
    ...(stateDesign ? { stateDesign } : {}),
  };
};

export const hydratePageConfigVisualAssets = async (page: PageConfig): Promise<PageConfig> => ({
  ...page,
  components: await Promise.all(page.components.map(async (component): Promise<PageComponent> => {
    if (component.type === "panel" && component.kind === "stage") {
      return {
        ...component,
        decoration: await hydrateLevelStageDecoration(
          normalizeLevelStageDecoration(component.decoration),
        ),
      };
    }

    if (component.type === "button") {
      return hydrateButtonComponent(component);
    }

    return component;
  })),
});
