import type {
  DynamicTextProgram,
  DynamicTextStatement,
  DynamicTextValue,
} from "../objects/ui-customization/dynamic-text-program.js";

const normalizeDynamicTextValue = (value: unknown): DynamicTextValue => {
  if (!value || typeof value !== "object") {
    return { type: "literal", text: "" };
  }

  const candidate = value as Partial<DynamicTextValue>;
  if (candidate.type === "variable" && candidate.name) {
    return { type: "variable", name: candidate.name };
  }

  if (candidate.type === "literal") {
    return { type: "literal", text: candidate.text ?? "" };
  }

  return { type: "literal", text: "" };
};

const normalizeOutputStatement = (statement: Record<string, unknown>): DynamicTextStatement => {
  if (Array.isArray(statement.parts) && statement.parts.length > 0) {
    return {
      type: "output",
      parts: statement.parts.map(normalizeDynamicTextValue),
    };
  }

  if (statement.value) {
    return {
      type: "output",
      parts: [normalizeDynamicTextValue(statement.value)],
    };
  }

  return {
    type: "output",
    parts: [{ type: "literal", text: "" }],
  };
};

export const normalizeDynamicTextStatement = (statement: unknown): DynamicTextStatement | null => {
  if (!statement || typeof statement !== "object") {
    return null;
  }

  const candidate = statement as Record<string, unknown>;
  if (candidate.type === "output") {
    return normalizeOutputStatement(candidate);
  }

  if (candidate.type !== "if") {
    return null;
  }

  const then = Array.isArray(candidate.then)
    ? candidate.then.flatMap((entry) => {
        const normalized = normalizeDynamicTextStatement(entry);
        return normalized ? [normalized] : [];
      })
    : [];
  const elseBranch = Array.isArray(candidate.else)
    ? candidate.else.flatMap((entry) => {
        const normalized = normalizeDynamicTextStatement(entry);
        return normalized ? [normalized] : [];
      })
    : undefined;

  return {
    type: "if",
    left: normalizeDynamicTextValue(candidate.left),
    operator: candidate.operator === "neq" || candidate.operator === "contains" ? candidate.operator : "eq",
    right: normalizeDynamicTextValue(candidate.right),
    then,
    ...(elseBranch && elseBranch.length > 0 ? { else: elseBranch } : {}),
  };
};

export const normalizeDynamicTextProgram = (program: DynamicTextProgram | undefined): DynamicTextProgram => ({
  statements: (program?.statements ?? [])
    .map(normalizeDynamicTextStatement)
    .filter((statement): statement is DynamicTextStatement => statement !== null),
});

export const getMainFlowOutputStatements = (
  program: DynamicTextProgram,
): Extract<DynamicTextStatement, { type: "output" }>[] =>
  normalizeDynamicTextProgram(program).statements.filter(
    (statement): statement is Extract<DynamicTextStatement, { type: "output" }> => statement.type === "output",
  );

export const createOutputStatement = (
  parts: DynamicTextValue[] = [{ type: "literal", text: "" }],
): Extract<DynamicTextStatement, { type: "output" }> => ({
  type: "output",
  parts: parts.length > 0 ? parts : [{ type: "literal", text: "" }],
});
