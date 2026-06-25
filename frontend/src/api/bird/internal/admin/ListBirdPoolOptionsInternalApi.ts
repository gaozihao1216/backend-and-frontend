import { z } from "zod";
import { APIMessage } from "../../../../system/api/APIMessage.js";

/** Mirrors backend internal API bird/api/internal/admin/ListBirdPoolOptionsInternalApi.scala; not registered as a public frontend route. */
export class ListBirdPoolOptionsInternalAPI extends APIMessage<unknown> {

  constructor() {
    super();
  }

  override get responseSchema() {
    return z.unknown();
  }
}
