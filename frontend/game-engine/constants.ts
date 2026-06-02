export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const GRAVITY_Y = 1;
export const LEVEL_GRAVITY_REFERENCE = 9.8;

export const GROUND_HEIGHT = 48;

export const BIRD_RADIUS = 18;
export const PIG_RADIUS = 22;

export const BLOCK_WIDTH = 72;
export const BLOCK_HEIGHT = 72;

export const SLINGSHOT_X = WORLD_WIDTH * 0.22;
export const SLINGSHOT_Y = WORLD_HEIGHT - GROUND_HEIGHT - BIRD_RADIUS - 64;
export const MAX_DRAG_DISTANCE = 82;
export const LAUNCH_POWER = 0.22;

export const PIG_MAX_HEALTH = 100;
export const BLOCK_MAX_HEALTH = 140;
export const PIG_DAMAGE_FACTOR = 3.6;
export const BLOCK_DAMAGE_FACTOR = 2.4;
export const BLOCK_GROUND_DAMAGE_MULTIPLIER = 0.35;
export const MIN_DAMAGE_IMPULSE = 1.75;
export const SETTLE_SPEED_THRESHOLD = 0.55;
export const SETTLE_TIME_MS = 1200;
