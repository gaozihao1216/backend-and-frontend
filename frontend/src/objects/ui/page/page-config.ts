import { z } from "zod";
import { PageComponentSchema } from "../component/page-component.js";
import { PageLayoutSchema } from "./page-layout.js";

export const UiEndpointSchema = z.enum(["player", "designer", "admin", "director"]);
export type UiEndpoint = z.infer<typeof UiEndpointSchema>;

export const PageSurfaceModeSchema = z.enum(["composed", "staticEmbed"]).default("composed");
export type PageSurfaceMode = z.infer<typeof PageSurfaceModeSchema>;

export const PageConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  roleScope: UiEndpointSchema,
  layout: PageLayoutSchema,
  surfaceMode: PageSurfaceModeSchema,
  components: z.array(PageComponentSchema),
});
export type PageConfig = z.infer<typeof PageConfigSchema>;
