import { z } from "zod";

export const AdminLevelSchema = z.enum(["standard", "director"]);
export type AdminLevel = z.infer<typeof AdminLevelSchema>;
