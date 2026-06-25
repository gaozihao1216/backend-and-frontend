import type {
  DynamicTextCompareOperator,
  DynamicTextProgram,
  DynamicTextStatement,
  DynamicTextValue,
  TextContentMode,
} from "../../../../objects/ui-customization/dynamic-text-program.js";
import type { TextComponent } from "../../../../objects/ui-customization/ui-customization-objects.js";
import type { UiPreviewUser } from "../../../../objects/ui-customization/preview-user.js";
import {
  buildUiTextRuntimeContext,
  type UiTextRuntimeContext,
} from "../ui-config/ui-text-runtime-context.js";
import { normalizeDynamicTextProgram } from "./dynamic-text-program-normalize.js";
import { interpolatePreviewText } from "../../components/ui-renderer/ui-renderer-utils.js";

const resolveDynamicTextValue = (
  value: DynamicTextValue,
  context?: UiTextRuntimeContext,
): string => {
  if (value.type === "literal") {
    return value.text;
  }

  if (!context) {
    return `{{${value.name}}}`;
  }

  switch (value.name) {
    case "nickname":
      return context.nickname;
    case "roleLabel":
      return context.roleLabel;
    case "apiUserId":
      return context.apiUserId;
    case "roleScope":
      return context.roleScope;
    case "coins":
      return String(context.coins);
    case "gems":
      return String(context.gems);
    case "fragments":
      return String(context.fragments);
    case "clearedLevelCount":
      return String(context.clearedLevelCount);
    default:
      return "";
  }
};

const compareDynamicTextValues = (
  left: string,
  operator: DynamicTextCompareOperator,
  right: string,
): boolean => {
  switch (operator) {
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    case "contains":
      return left.includes(right);
    default:
      return false;
  }
};

export const evaluateDynamicTextStatements = (
  statements: DynamicTextStatement[],
  context?: UiTextRuntimeContext,
): string => {
  let output = "";

  for (const statement of statements) {
    if (statement.type === "output") {
      for (const part of statement.parts) {
        output += resolveDynamicTextValue(part, context);
      }
      continue;
    }

    const left = resolveDynamicTextValue(statement.left, context);
    const right = resolveDynamicTextValue(statement.right, context);
    if (compareDynamicTextValues(left, statement.operator, right)) {
      output += evaluateDynamicTextStatements(statement.then, context);
    } else if (statement.else) {
      output += evaluateDynamicTextStatements(statement.else, context);
    }
  }

  return output;
};

export const evaluateDynamicTextProgram = (
  program: DynamicTextProgram | undefined,
  previewUser?: UiPreviewUser,
  uiData?: Record<string, unknown>,
): string => {
  const context = buildUiTextRuntimeContext(previewUser, uiData);
  const normalized = normalizeDynamicTextProgram(program);
  return evaluateDynamicTextStatements(normalized.statements, context);
};

export const resolveTextComponentContent = (
  component: Pick<TextComponent, "text" | "textContentMode" | "dynamicTextProgram">,
  previewUser?: UiPreviewUser,
  uiData?: Record<string, unknown>,
): string => {
  if (component.textContentMode === "dynamic") {
    return evaluateDynamicTextProgram(component.dynamicTextProgram, previewUser, uiData);
  }

  return interpolatePreviewText(component.text, previewUser, uiData);
};

export const getTextContentMode = (mode: TextContentMode | undefined): TextContentMode =>
  mode ?? "fixed";

export const formatDynamicTextValuePreview = (value: DynamicTextValue): string => {
  if (value.type === "literal") {
    return JSON.stringify(value.text);
  }

  return value.name;
};
