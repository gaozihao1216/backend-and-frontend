# 当前程序表现

本文描述项目**现在能做什么**、**如何演示**，以及**已知限制**。架构细节见 [frontend-architecture.md](./frontend-architecture.md) 与 [backend-architecture.md](./backend-architecture.md)。

## 产品定位

UGC 关卡平台（灵感来自 Angry Birds 类玩法）：

- **设计师**：创建关卡、编辑地形/实体、提交审核；可设计自定义鸟类
- **管理员**：审核关卡与鸟类投稿、管理社区评论
- **总监管理员**：UI 定制、关卡地图配置、鸟类技能实验、关卡槽位分配
- **玩家**：浏览关卡地图、游玩、评分、收藏、评论；商店、社交、备战等扩展页面

## 启动与访问

```bash
npm install
npm run dev
```

| 服务 | 地址 |
| --- | --- |
| 前端 | http://localhost:5173 |
| 后端 | http://localhost:3000 |
| 健康检查 | GET http://localhost:3000/health |

## 演示账号

### 前端 Mock 登录

- 玩家：昵称 + 密码注册即可
- 设计师 / 管理员：需固定验证码 `66260696`
- 会话保存在浏览器 `localStorage`，刷新可恢复

### 后端内置用户（绑定后调用 API）

| ID | 角色 | 管理员等级 | 用途 |
| --- | --- | --- | --- |
| `player-1` | player | — | 游玩、评分、评论 |
| `designer-1` | designer | — | 创建/提交关卡 |
| `admin-1` | admin | standard | 关卡审核、评论管理 |
| `admin-director-1` | admin | director | UI 定制、总监控制台 |

前端注册账号需通过「绑定后端用户」面板关联上述 ID，否则无法调用对应角色 API。

## 已实现的核心流程

### 1. UGC 关卡生命周期

```text
设计师创建关卡 (draft)
    → 提交审核 (pending)
        → 管理员批准 → published（玩家可见）
        → 管理员拒绝 → rejected
```

玩家可对已发布关卡：评分（1–5）、收藏、发表评论。

### 2. 关卡编辑与游玩

- **DesignerPage**：可视化 + JSON 双模式编辑；支持地形贝塞尔、障碍物、敌人、鸟库存等
- **GameCanvas / PlayableLevelSurface**：Matter.js 物理模拟；含技能系统与障碍物破碎
- **关卡地图**：共享 LevelMap 配置，支持总监定制节点样式与路径

### 3. 管理员能力

**普通管理员（Standard）**

- 待审核关卡列表、批准/拒绝
- 社区评论列表与删除
- 待审核鸟类设计列表与审核

**总监管理员（Director）**

- UI 页面构建器、按钮模板、拉伸视觉模板
- 关卡界面优化、关卡槽位分配、鸟类技能实验室
- 关卡背景模板管理
- 权限查看与总监权限转移

两类管理员入口分离：普通管理员走 `/admin/proposals`，总监走 `/director_console`。

### 4. 玩家扩展页面

以下页面已有 UI 与后端数据接口（部分为演示/种子数据驱动）：

- 关卡地图与选关 (`/levels/:id`)
- 商店 (`/player_shop`)
- 社交 (`/player_social`)
- 备战 (`/player_preparation`)
- 社区大厅 (`/community_hall`)

玩家 UI 运行时通过 `/player/ui/*` 拉取动态配置（签到、钱包、进度等）。

### 5. 鸟类设计

- 设计师在 `/designer/birds` 创建、编辑、提交鸟类设计
- 管理员审核通过后可在关卡/备战中使用

## 类型安全与契约

- 前端每个 API 响应用 Zod 校验
- 后端 APIMessage 返回强类型 `Either[HttpError, A]`
- 前后端对象命名与模块划分对齐

## 数据持久化现状

| 模式 | 行为 |
| --- | --- |
| 默认 in-memory | 无需 Docker；重启后回到种子数据 |
| JDBC（需配置环境变量） | PostgreSQL 持久化；适合联调与集成测试 |

多数表已具备 jdbc 实现，但**默认仍以 in-memory 启动**，避免本地未装数据库时无法运行。

## 已知限制

1. **认证为演示级**：无真实密码哈希、JWT 或会话服务；生产环境不可用
2. **UI 定制能力偏配置型**：总监可管理 PageConfig 与模板，但尚非完整可视化 WYSIWYG 编辑器
3. **玩家经济/社交**：后端有 wallet、shop、social 表与服务，业务规则仍为 MVP/演示深度
4. **测试覆盖不均衡**：前端有部分单元测试；Scala 端测试较少
5. **单实例部署**：无水平扩展、缓存、消息队列等生产设施

## 建议演示顺序（课程/答辩）

1. 登录并绑定 `designer-1` → 创建关卡 → 提交审核
2. 切换绑定 `admin-1` → 批准关卡
3. 绑定 `player-1` → 地图选关 → 游玩 → 评分
4. 绑定 `admin-director-1` → 总监控制台调整 UI 或关卡地图
5. （可选）展示 DesignerPage 编辑器与鸟类设计流程

## 验证命令

```bash
npm run check    # TypeScript
npm test         # 前端测试
sbt compile      # Scala 编译
```
