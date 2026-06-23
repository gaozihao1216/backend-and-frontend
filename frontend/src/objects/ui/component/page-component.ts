import { z } from "zod";
import { ButtonComponentSchema } from "./button-component.js";
import { ListComponentSchema } from "./list-component.js";
import { PanelComponentSchema } from "./panel-component.js";
import { TextComponentSchema } from "./text-component.js";
import { WidgetComponentSchema } from "./widget-component.js";

export const PageComponentSchema = z.discriminatedUnion("type", [
  ButtonComponentSchema,
  PanelComponentSchema,
  TextComponentSchema,
  ListComponentSchema,
  WidgetComponentSchema,
]);
export type PageComponent = z.infer<typeof PageComponentSchema>;

export {
  ButtonComponentSchema,
  type ButtonComponent,
} from "./button-component.js";
export {
  PanelComponentSchema,
  type PanelComponent,
  LevelMapPathDesignSchema,
  type LevelMapPathDesign,
  LevelMapPathEdgeSchema,
  type LevelMapPathEdge,
} from "./panel-component.js";
export { PanelDecorationSchema } from "./stretch-visual-design.js";
export { TextComponentSchema, type TextComponent } from "./text-component.js";
export { ListComponentSchema, type ListComponent } from "./list-component.js";
export { WidgetComponentSchema, type WidgetComponent } from "./widget-component.js";
