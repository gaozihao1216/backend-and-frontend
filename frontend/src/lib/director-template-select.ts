import type { UiButtonTemplate } from "../objects/api/api-contracts.js";
import type {
  ButtonBaseDesign,
  ButtonStateOption,
  PanelDecoration,
  StretchVisualDesign,
} from "../objects/ui-customization/ui-customization-objects.js";
import type { StretchVisualTemplate } from "../objects/ui/stretch_template/stretch-visual-template.js";

const DEFAULT_PATTERN_FRAME: NonNullable<StretchVisualDesign["frame"]> = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export type TemplateSelectKind = "library";

export type ParsedTemplateSelectValue = {
  kind: TemplateSelectKind;
  id: string;
};

export type TemplateSelectOption = {
  value: string;
  label: string;
};

export const formatTemplateSelectValue = (kind: TemplateSelectKind, id: string) => `${kind}:${id}`;

export const parseTemplateSelectValue = (value: string): ParsedTemplateSelectValue | null => {
  const separatorIndex = value.indexOf(":");
  if (separatorIndex <= 0) {
    return null;
  }

  const kind = value.slice(0, separatorIndex);
  const id = value.slice(separatorIndex + 1);
  if (kind !== "library" || !id) {
    return null;
  }

  return { kind, id };
};

export const createLibraryTemplateSelectOptions = <T extends { id: string; name: string }>(
  templates: T[],
): TemplateSelectOption[] =>
  templates.map((template) => ({
    value: formatTemplateSelectValue("library", template.id),
    label: template.name,
  }));

export const getPanelDecorationSelectValue = (decoration: PanelDecoration) =>
  decoration.backgroundDesign
    ? formatTemplateSelectValue("library", decoration.backgroundDesign.templateId)
    : "";

export const resolvePanelDecoration = (
  value: string,
  panelTemplates: Map<string, StretchVisualTemplate>,
  accentColor?: string,
): PanelDecoration | null => {
  const parsed = parseTemplateSelectValue(value);
  if (!parsed) {
    return null;
  }

  const template = panelTemplates.get(parsed.id);
  if (!template) {
    return null;
  }

  return {
    templateId: "plain",
    ...(accentColor ? { accentColor } : {}),
    backgroundDesign: {
      templateId: template.id,
      sourceDataUrl: template.sourceDataUrl,
    },
  };
};

export const toButtonBaseDesign = (template: UiButtonTemplate): ButtonBaseDesign => ({
  templateId: template.id,
  sourceDataUrl: template.sourceDataUrl,
  scalingMode: template.scalingMode,
  ...(template.slice ? { slice: template.slice } : {}),
});

export const toStretchVisualDesign = (
  template: StretchVisualTemplate,
  frame?: StretchVisualDesign["frame"],
): StretchVisualDesign => ({
  templateId: template.id,
  sourceDataUrl: template.sourceDataUrl,
  ...(frame ? { frame } : {}),
});

export const getButtonBaseTemplateSelectValue = (state: {
  baseTemplateValue?: string;
  baseDesign?: ButtonBaseDesign;
}) =>
  state.baseDesign
    ? formatTemplateSelectValue("library", state.baseDesign.templateId)
    : parseTemplateSelectValue(state.baseTemplateValue ?? "")?.kind === "library"
      ? state.baseTemplateValue ?? ""
      : "";

export const getPatternTemplateSelectValue = (state: {
  patternTemplateValue?: string;
  patternDesign?: StretchVisualDesign;
}) =>
  state.patternDesign
    ? formatTemplateSelectValue("library", state.patternDesign.templateId)
    : parseTemplateSelectValue(state.patternTemplateValue ?? "")?.kind === "library"
      ? state.patternTemplateValue ?? ""
      : "";

export const getPatternLayerTemplateSelectValue = (layer: {
  templateValue?: string;
  design?: StretchVisualDesign;
}) => {
  if (layer.design && layer.design.templateId !== "css-art-text") {
    return formatTemplateSelectValue("library", layer.design.templateId);
  }

  return parseTemplateSelectValue(layer.templateValue ?? "")?.kind === "library"
    ? layer.templateValue ?? ""
    : "";
};

export const resolveButtonBaseTemplateSelection = (
  value: string,
  buttonTemplates: Map<string, UiButtonTemplate>,
): Pick<ButtonStateOption, "baseDesign"> => {
  const parsed = parseTemplateSelectValue(value);
  if (!parsed) {
    return {};
  }

  const template = buttonTemplates.get(parsed.id);
  if (!template) {
    return {};
  }

  return { baseDesign: toButtonBaseDesign(template) };
};

export const resolvePatternTemplateSelection = (
  value: string,
  patternTemplates: Map<string, StretchVisualTemplate>,
): Pick<ButtonStateOption, "patternDesign"> => {
  const parsed = parseTemplateSelectValue(value);
  if (!parsed) {
    return {};
  }

  const template = patternTemplates.get(parsed.id);
  if (!template) {
    return {};
  }

  return { patternDesign: toStretchVisualDesign(template, DEFAULT_PATTERN_FRAME) };
};

export const createButtonStateDraftPatchFromBaseTemplate = (
  value: string,
  buttonTemplates: Map<string, UiButtonTemplate>,
) => {
  if (!value) {
    return {
      baseTemplateValue: "",
    };
  }

  const resolved = resolveButtonBaseTemplateSelection(value, buttonTemplates);
  if (resolved.baseDesign) {
    return {
      baseTemplateValue: value,
      baseDesign: resolved.baseDesign,
    };
  }

  return {
    baseTemplateValue: value,
  };
};

export const createButtonStateDraftPatchFromPatternTemplate = (
  value: string,
  patternTemplates: Map<string, StretchVisualTemplate>,
) => {
  if (!value) {
    return {
      patternTemplateValue: "",
    };
  }

  const resolved = resolvePatternTemplateSelection(value, patternTemplates);
  if (resolved.patternDesign) {
    return {
      patternTemplateValue: value,
      patternDesign: resolved.patternDesign,
      icon: "",
    };
  }

  return {
    patternTemplateValue: value,
    icon: "",
  };
};
