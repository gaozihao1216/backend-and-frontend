import type { BlockGameEntity, GameBody } from "../core/types.js";
import { getBlockEntity } from "../game-session/config.js";

export type DamageableSnapshot = {
  currentHp: number;
  maxHp: number;
  isTerminal: boolean;
};

export const getDamageableSnapshot = (body: GameBody): DamageableSnapshot | null => {
  const blockEntity = getBlockEntity(body);
  if (blockEntity) {
    return {
      currentHp: blockEntity.hp,
      maxHp: blockEntity.maxHp,
      isTerminal: blockEntity.state === "broken" || blockEntity.state === "cracking",
    };
  }

  if (body.health === undefined) {
    return null;
  }

  return {
    currentHp: body.health,
    maxHp: body.maxHealth ?? body.health,
    isTerminal: body.destroyed === true,
  };
};

export const applyDamageToBody = (
  body: GameBody,
  amount: number,
  blockEntity: BlockGameEntity | null,
) => {
  if (blockEntity) {
    blockEntity.hp = Math.max(0, blockEntity.hp - amount);
    return blockEntity.hp;
  }

  if (body.health === undefined) {
    return null;
  }

  body.health = Math.max(0, body.health - amount);
  return body.health;
};
