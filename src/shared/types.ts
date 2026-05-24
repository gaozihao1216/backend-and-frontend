// shared/types.ts 是整个项目的“统一出口”：
// 前端、后端都只需要从这里 import，即可拿到 schema 和对应类型。
export * from "./schemas/common.js";
export * from "./schemas/user.js";
export * from "./schemas/level.js";
export * from "./schemas/submission.js";
export * from "./schemas/comment.js";
export * from "./schemas/favorite.js";
export * from "./schemas/rating.js";
export * from "./schemas/api.js";
