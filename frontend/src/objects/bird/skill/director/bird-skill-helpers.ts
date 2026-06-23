import { BirdSkillSetSchema, type BirdSkillSet, type BirdSkillStage, type SkillSpec } from "../../../../lib/game-engine/skills/skill-spec.js";

export const parseBirdSkillSet = (value: unknown): BirdSkillSet | null => {
  const parsed = BirdSkillSetSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export const createEmptySkillStage = (tier: number, label = ""): BirdSkillStage => ({
  id: `tier-${tier}`,
  label: label || `${tier} 阶技能`,
  trigger: "on_tap",
  specs: [],
  maxActivations: 1,
});

export const createDefaultSkillSet = (birdType: string, tierLabels: string[] = []): BirdSkillSet => ({
  stages: [1, 2, 3].map((tier) =>
    createEmptySkillStage(tier, tierLabels[tier - 1] ?? `${tier} 阶技能`),
  ),
});

export const cloneSkillSpec = (spec: SkillSpec): SkillSpec =>
  JSON.parse(JSON.stringify(spec)) as SkillSpec;

export const cloneSkillSet = (skillSet: BirdSkillSet): BirdSkillSet =>
  JSON.parse(JSON.stringify(skillSet)) as BirdSkillSet;

export const moveSpec = (
  stage: BirdSkillStage,
  fromIndex: number,
  toIndex: number,
): BirdSkillStage => {
  const specs = [...stage.specs];
  const [item] = specs.splice(fromIndex, 1);
  if (!item) {
    return stage;
  }
  specs.splice(toIndex, 0, item);
  return { ...stage, specs };
};

export const removeSpec = (stage: BirdSkillStage, index: number): BirdSkillStage => ({
  ...stage,
  specs: stage.specs.filter((_, specIndex) => specIndex !== index),
});

export const appendSpec = (stage: BirdSkillStage, spec: SkillSpec): BirdSkillStage => ({
  ...stage,
  specs: [...stage.specs, cloneSkillSpec(spec)],
});

export const updateStage = (
  skillSet: BirdSkillSet,
  stageIndex: number,
  stage: BirdSkillStage,
): BirdSkillSet => ({
  ...skillSet,
  stages: skillSet.stages.map((entry, index) => (index === stageIndex ? stage : entry)),
});

export const updateSpec = (
  stage: BirdSkillStage,
  specIndex: number,
  spec: SkillSpec,
): BirdSkillStage => ({
  ...stage,
  specs: stage.specs.map((entry, index) => (index === specIndex ? spec : entry)),
});
