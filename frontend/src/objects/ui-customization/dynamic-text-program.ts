import { z } from "zod";

export const TextContentModeSchema = z.enum(["fixed", "dynamic"]);
export type TextContentMode = z.infer<typeof TextContentModeSchema>;

export const DynamicTextVariableSchema = z.enum([
  "nickname",
  "roleLabel",
  "apiUserId",
  "roleScope",
  "coins",
  "gems",
  "fragments",
  "clearedLevelCount",
]);
export type DynamicTextVariable = z.infer<typeof DynamicTextVariableSchema>;

export type DynamicTextVariableGroupId = "login" | "account";

export const DYNAMIC_TEXT_VARIABLE_META: ReadonlyArray<{
  name: DynamicTextVariable;
  label: string;
  sample: string;
  group: DynamicTextVariableGroupId;
  playerOnly?: boolean;
}> = [
  { name: "nickname", label: "昵称", sample: "玩家测试账号", group: "login" },
  { name: "roleLabel", label: "角色标签", sample: "玩家端", group: "login" },
  { name: "apiUserId", label: "账号 ID", sample: "player-1", group: "login" },
  { name: "roleScope", label: "端类型", sample: "player", group: "login" },
  { name: "coins", label: "金币数", sample: "1280", group: "account", playerOnly: true },
  { name: "gems", label: "钻石数", sample: "96", group: "account", playerOnly: true },
  { name: "fragments", label: "碎片数", sample: "0", group: "account", playerOnly: true },
  {
    name: "clearedLevelCount",
    label: "已通关关卡数",
    sample: "1",
    group: "account",
    playerOnly: true,
  },
];

export const DYNAMIC_TEXT_VARIABLE_GROUPS: ReadonlyArray<{
  id: DynamicTextVariableGroupId;
  label: string;
}> = [
  { id: "login", label: "登录信息" },
  { id: "account", label: "玩家资产与进度" },
];

export const DynamicTextValueSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("literal"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("variable"),
    name: DynamicTextVariableSchema,
  }),
]);
export type DynamicTextValue = z.infer<typeof DynamicTextValueSchema>;

export const DynamicTextCompareOperatorSchema = z.enum(["eq", "neq", "contains"]);
export type DynamicTextCompareOperator = z.infer<typeof DynamicTextCompareOperatorSchema>;

export type DynamicTextStatement =
  | {
      type: "output";
      parts: DynamicTextValue[];
    }
  | {
      type: "if";
      left: DynamicTextValue;
      operator: DynamicTextCompareOperator;
      right: DynamicTextValue;
      then: DynamicTextStatement[];
      else?: DynamicTextStatement[];
    };

export const DynamicTextStatementSchema: z.ZodType<DynamicTextStatement> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("output"),
      parts: z.array(DynamicTextValueSchema).min(1),
    }),
    z.object({
      type: z.literal("if"),
      left: DynamicTextValueSchema,
      operator: DynamicTextCompareOperatorSchema,
      right: DynamicTextValueSchema,
      then: z.array(DynamicTextStatementSchema),
      else: z.array(DynamicTextStatementSchema).optional(),
    }),
  ]),
) as z.ZodType<DynamicTextStatement>;

export const DynamicTextProgramSchema = z.object({
  statements: z.array(DynamicTextStatementSchema).default([]),
});
export type DynamicTextProgram = z.infer<typeof DynamicTextProgramSchema>;

export const createDefaultDynamicTextProgram = (): DynamicTextProgram => ({
  statements: [
    {
      type: "output",
      parts: [
        { type: "literal", text: "你好，" },
        { type: "variable", name: "nickname" },
      ],
    },
  ],
});

export const getDynamicTextVariableLabel = (name: DynamicTextVariable): string =>
  DYNAMIC_TEXT_VARIABLE_META.find((entry) => entry.name === name)?.label ?? name;
