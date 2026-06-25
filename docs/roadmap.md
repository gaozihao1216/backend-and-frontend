# 后续改进方向

本文汇总当前缺口与建议优先级，供迭代规划参考。已完成项见 [current-status.md](./current-status.md)。

## 优先级概览

| 优先级 | 方向 | 说明 |
| --- | --- | --- |
| P0 | 默认持久化策略 | PostgreSQL/JDBC 已成为唯一后端存储路径，后续补齐部署与备份策略 |
| P1 | 真实认证 | 替换 mock auth + `x-user-id` 演示方案 |
| P1 | 管理员分级完善 | Standard/Director 已存在，需补全权限边界测试与 UI 分流一致性 |
| P2 | UI 定制体验 | 从配置 JSON 走向更直观的可视化编辑 |
| P2 | 游戏与关卡工具 | 技能平衡、关卡验证、性能优化 |
| P3 | 运维与质量 | CI、Scala 测试、监控、部署文档 |

---

## 1. 数据持久化

**现状**：后端只使用 PostgreSQL/JDBC；`npm run dev` 会启动 Postgres、后端与前端。

**建议**：

- 提供 `.env.example` 与 `npm run dev` 一键启动「前端 + 后端 + Postgres」（已完成）
- CI 中增加 JDBC 模式 smoke test（`.github/workflows/ci.yml` 的 `scala-jdbc` job；本地 `npm run test:backend:jdbc`）
- 完善 PostgreSQL seed 与迁移策略，避免空库体验差

## 2. 认证与安全

**现状**：前端 localStorage mock；后端信任 `x-user-id` 头。

**建议路径**：

1. 短期：绑定流程文档化 + 后端校验绑定关系，防止伪造任意 userId
2. 中期：Session 或 JWT + httpOnly cookie
3. 长期：密码哈希、角色变更审计、总监权限转移留痕

## 3. 管理员分级（Standard / Director）

**已完成**：`AdminLevel` 对象、种子账号、`requireAdminLevel`、总监 UI API、页面入口分流。

**待完善**：

- ~~自动化测试：Standard 不能访问 `/admin/director/ui/*`；Director 不能访问评论管理 API~~（已覆盖于 `AdminAccessControlSuite` / `ApiRouterAuthSuite`）
- ~~前端路由守卫与后端权限双重校验结果一致~~（`frontend/src/lib/route-access.ts` + 单元测试）
- 总监「废除投稿」等高级操作的产品规则文档化
- `TransferDirectorPermission` 流程的操作确认与审计

## 4. UI 定制系统

**现状**：PageConfig、ButtonTemplate、StretchVisualTemplate、SharedLevelMap 已可 CRUD；前端有 DynamicPageRenderer。

**建议**：

- 页面构建器：组件拖拽、实时预览、版本/发布/回滚
- 模板资源：图片上传与 CDN，而非仅 URL/本地缓存
- 玩家端：减少 localStorage 与 API 双源不一致（以服务端为权威）
- 性能：大 PageConfig 懒加载与 diff 更新

## 5. 关卡与游戏引擎

- **关卡校验**：提交前检测可玩性（是否有鸟、目标、可达性）
- **DesignerLevelEditorPage**：继续收敛 hook 边界，降低 `index.tsx` 编排复杂度
- **物理与技能**：更多单元测试覆盖 skill executor、fracture、settling
- **移动端**：触控瞄准与性能（Matter.js 在低端设备上的帧率）

## 6. 玩家系统（商店 / 社交 / 备战）

**现状**：后端 player 模块与前端页面已联通，规则深度有限。

**建议**：

- 明确经济模型（货币来源、消耗、防刷）
- 社交：真实好友/留言模型 vs 演示静态数据
- 备战与关卡 `birdPool` 配置端到端一致
- 签到/周奖励与 `CheckInPanelReward` 配置 UI 打通

## 7. 鸟类设计管线

- 设计师版本管理与 diff
- 审核工作流与关卡引用的联动（审核通过后自动进入可选鸟池）
- 技能参数校验与 Director Bird Skill Lab 数据同步

## 8. 工程质量

- **测试**：扩展 `npm test`；为关键 APIMessage 增加 Scala 测试
- **CI**：`check` + `test` + `sbt compile` 在 PR 上必跑
- **API 契约**：考虑从 Zod schema 生成契约测试或 OpenAPI 快照
- **错误体验**：前端统一 toast/错误码映射；后端 error code 枚举化

## 9. 部署与运维

- 生产构建：前端静态资源 + 反向代理到 Scala 服务
- Docker 多阶段镜像（sbt assembly + nginx）
- 健康检查、日志结构化、数据库迁移工具（Flyway/Liquibase）

---

## 建议迭代顺序

若资源有限，推荐按以下顺序推进：

```text
1. JDBC 默认开发环境 + smoke test
2. 管理员权限自动化测试
3. UI 定制「发布/回滚」最小闭环
4. 认证方案升级（至少 signed token）
5. 关卡校验与游戏测试补强
6. 玩家经济规则产品化
7. 部署与 CI 硬化
```

每完成一阶段，应更新 [current-status.md](./current-status.md) 中的「已实现」与「已知限制」两节，避免文档再次过期。
