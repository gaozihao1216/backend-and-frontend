import { APIMessage } from "./APIMessage.js";

export abstract class APIWithTokenMessage<Response> extends APIMessage<Response> {
  readonly userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  override get needsUserId(): boolean {
    return true;
  }
}
