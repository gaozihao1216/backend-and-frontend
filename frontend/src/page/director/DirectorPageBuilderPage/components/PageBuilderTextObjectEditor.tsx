import { useMemo } from "react";
import {
  getTextArtAccentColor,
  getTextArtAccentHint,
  getTextArtAccentLabel,
  getTextArtGradientDirection,
  getTextArtGradientIntensity,
  isArtTextPreset,
  patchTextArtDesign,
  resolveTextArtDesign,
  TEXT_ART_GRADIENT_DIRECTION_OPTIONS,
  TEXT_ART_GRADIENT_INTENSITY_OPTIONS,
  TEXT_ART_PRESET_OPTIONS,
  usesTextArtGradient,
} from "../../../../lib/art-text-styles.js";
import { getTextContentMode } from "../../../../lib/dynamic-text-program.js";
import { normalizeDynamicTextProgram } from "../../../../lib/dynamic-text-program-normalize.js";
import type { TextContentMode } from "../../../../objects/ui-customization/dynamic-text-program.js";
import { createDefaultDynamicTextProgram } from "../../../../objects/ui-customization/dynamic-text-program.js";
import type { TextComponent, UiEndpoint } from "../../../../objects/ui-customization/ui-customization-objects.js";
import type { UiPreviewUser } from "../../../../objects/ui-customization/preview-user.js";
import type {
  TextArtGradientDirection,
  TextArtGradientIntensity,
  TextArtPreset,
} from "../../../../objects/ui-customization/ui-customization-objects.js";
import { DynamicTextBlockEditor } from "./DynamicTextBlockEditor.js";

type PageBuilderTextObjectEditorProps = {
  component: TextComponent;
  pageRoleScope: UiEndpoint;
  previewUser?: UiPreviewUser;
  onChange: (nextComponent: TextComponent) => void;
};

export const PageBuilderTextObjectEditor = ({
  component,
  pageRoleScope,
  previewUser,
  onChange,
}: PageBuilderTextObjectEditorProps) => {
  const textContentMode = getTextContentMode(component.textContentMode);
  const textArtDesign = resolveTextArtDesign(component.artTextDesign);
  const textPreset = textArtDesign.preset;
  const showGradientControls = usesTextArtGradient(textPreset);
  const dynamicProgram = useMemo(
    () => normalizeDynamicTextProgram(component.dynamicTextProgram ?? createDefaultDynamicTextProgram()),
    [component.dynamicTextProgram],
  );

  const setTextContentMode = (nextMode: TextContentMode) => {
    if (nextMode === "dynamic") {
      onChange({
        ...component,
        textContentMode: nextMode,
        dynamicTextProgram: dynamicProgram,
      });
      return;
    }

    onChange({
      ...component,
      textContentMode: nextMode,
    });
  };

  return (
    <section className="page-builder-text-object-editor">
      <fieldset className="page-builder-text-mode-fieldset">
        <legend>文案模式</legend>
        <label className="page-builder-check-row">
          <input
            type="radio"
            name={`text-content-mode-${component.id}`}
            checked={textContentMode === "fixed"}
            onChange={() => setTextContentMode("fixed")}
          />
          <span>固定文案</span>
        </label>
        <label className="page-builder-check-row">
          <input
            type="radio"
            name={`text-content-mode-${component.id}`}
            checked={textContentMode === "dynamic"}
            onChange={() => setTextContentMode("dynamic")}
          />
          <span>动态文案（拖拽积木拼接）</span>
        </label>
      </fieldset>

      {textContentMode === "fixed" ? (
        <>
          <label className="button-design-field">
            <span>文本内容</span>
            <textarea
              rows={3}
              value={component.text}
              onChange={(event) => onChange({ ...component, text: event.target.value })}
            />
          </label>
          <p className="meta">
            也可在预览中双击文本框直接编辑。支持占位符：{"{{nickname}}"}、{"{{coins}}"}、{"{{gems}}"}、{"{{fragments}}"} 等。
          </p>
        </>
      ) : (
        <DynamicTextBlockEditor
          program={dynamicProgram}
          pageRoleScope={pageRoleScope}
          {...(previewUser ? { previewUser } : {})}
          onChange={(nextProgram) => onChange({ ...component, dynamicTextProgram: nextProgram })}
        />
      )}

      <fieldset className="page-builder-text-style-fieldset">
        <legend>艺术字样式</legend>
        <label className="button-design-field">
          <span>样式预设</span>
          <select
            value={textPreset}
            onChange={(event) => {
              const nextPreset = event.target.value as TextArtPreset;
              onChange({
                ...component,
                artTextDesign: patchTextArtDesign(component.artTextDesign, { preset: nextPreset }),
              });
            }}
          >
            {TEXT_ART_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="meta panel-create-art-text-hint">
          {TEXT_ART_PRESET_OPTIONS.find((option) => option.value === textPreset)?.description
            ?? "选择书法体或渐变艺术字样式。"}
        </p>

        {showGradientControls ? (
          <>
            <label className="button-design-field">
              <span>渐变方向</span>
              <select
                value={getTextArtGradientDirection(textArtDesign)}
                onChange={(event) =>
                  onChange({
                    ...component,
                    artTextDesign: patchTextArtDesign(component.artTextDesign, {
                      gradientDirection: event.target.value as TextArtGradientDirection,
                    }),
                  })
                }
              >
                {TEXT_ART_GRADIENT_DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="button-design-field">
              <span>渐变强度</span>
              <select
                value={getTextArtGradientIntensity(textArtDesign)}
                onChange={(event) =>
                  onChange({
                    ...component,
                    artTextDesign: patchTextArtDesign(component.artTextDesign, {
                      gradientIntensity: event.target.value as TextArtGradientIntensity,
                    }),
                  })
                }
              >
                {TEXT_ART_GRADIENT_INTENSITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {isArtTextPreset(textPreset) ? (
          <>
            <label className="button-design-color-field">
              <span>{getTextArtAccentLabel(textPreset)}</span>
              <input
                type="color"
                value={getTextArtAccentColor(textArtDesign)}
                onChange={(event) =>
                  onChange({
                    ...component,
                    artTextDesign: patchTextArtDesign(component.artTextDesign, {
                      accentColor: event.target.value,
                    }),
                  })
                }
              />
            </label>
            <p className="meta panel-create-art-text-hint">{getTextArtAccentHint(textPreset)}</p>
          </>
        ) : null}
      </fieldset>
    </section>
  );
};
