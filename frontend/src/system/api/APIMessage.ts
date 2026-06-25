import type { z } from "zod";

export abstract class APIMessage<Response> {
  declare readonly responseType: Response;

  get needsUserId(): boolean {
    return false;
  }

  get responseSchema(): z.ZodType<Response, z.ZodTypeDef, unknown> {
    throw new Error(`${this.constructor.name} must define responseSchema`);
  }
}
