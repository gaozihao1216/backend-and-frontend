import type { SkillSpec } from "../../../../game/engine/skills/skill-spec.js";
import { SKILL_TEMPLATE_CATALOG } from "../../../../game/engine/skills/skill-template-catalog.js";
import { SKILL_PARAM_FIELDS, type SkillParamField } from "../../../../game/engine/skills/skill-param-metadata.js";

type SkillBlockParamEditorProps = {
  spec: SkillSpec;
  onChange: (spec: SkillSpec) => void;
};

const getNumericStep = (field: SkillParamField) => {
  if (field.key.includes("Ratio") || field.key === "falloff" || field.key === "velocityMultiplier") {
    return 0.05;
  }
  if (field.key === "pushForce" || field.key === "impulse" || field.key === "recoilImpulse") {
    return 0.001;
  }
  return 1;
};

const getNumericMin = (field: SkillParamField) => {
  if (field.key === "childCount") {
    return 2;
  }
  if (field.key.includes("Ratio") || field.key === "velocityMultiplier" || field.key === "maxRadiusScale") {
    return 0.1;
  }
  if (field.key === "pushForce" || field.key === "impulse" || field.key === "recoilImpulse") {
    return 0.001;
  }
  return 0;
};

const renderField = (
  field: SkillParamField,
  spec: SkillSpec,
  onChange: (spec: SkillSpec) => void,
) => {
  const raw = (spec as Record<string, unknown>)[field.key];
  const value = typeof raw === "number" ? raw : 0;

  return (
    <label key={field.key} className="skill-block-field">
      <span>{field.label}{field.unit ? ` (${field.unit})` : ""}</span>
      <input
        type="number"
        min={getNumericMin(field)}
        step={getNumericStep(field)}
        value={value}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (!Number.isFinite(parsed)) {
            return;
          }

          const nextValue =
            field.key === "durationMs" && parsed <= 0
              ? undefined
              : field.key.endsWith("Ms") || field.key === "childCount"
                ? Math.floor(parsed)
                : parsed;

          onChange({
            ...spec,
            [field.key]: nextValue,
          } as SkillSpec);
        }}
      />
      <small className="skill-block-field-hint">{field.hint}</small>
    </label>
  );
};

export const SkillBlockParamEditor = ({ spec, onChange }: SkillBlockParamEditorProps) => {
  const fields = SKILL_PARAM_FIELDS[spec.type];
  if (!fields?.length) {
    return <p className="meta">暂不支持编辑该技能类型。</p>;
  }

  return (
    <div className="skill-block-fields">
      {fields.map((field) => renderField(field, spec, onChange))}
    </div>
  );
};

export const getSkillTemplateLabel = (type: SkillSpec["type"]) =>
  SKILL_TEMPLATE_CATALOG.find((entry) => entry.type === type)?.label ?? type;
