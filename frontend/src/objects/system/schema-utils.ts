import { z } from "zod";

export const nullishToUndefined = <Output, T extends z.ZodType<Output>>(schema: T) =>
  z.union([schema, z.null()]).optional().transform((value): Output | undefined => value ?? undefined);
