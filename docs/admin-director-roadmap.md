# Admin Director Roadmap

本文记录管理员分级和总监管理员能力的改进方向、实施步骤，以及当前项目所处阶段。

## 当前阶段

当前系统已经具备基础 UGC 流程：

- 设计师创建关卡并提交审核。
- 管理员审核关卡提交。
- 玩家浏览、评分、收藏和评论已发布关卡。
- 后端使用 Scala/http4s + PostgreSQL。
- 前端 API schema 已与当前后端真实响应完成对齐。
- PostgreSQL Docker 环境可正常运行。

当前管理员仍然只有一个粗粒度角色：

```text
role = admin
```

还没有区分普通管理员和总监管理员。社区管理、关卡审核、未来 UI 美化管理等能力如果继续放在同一个 admin 概念下，会让权限、页面和对象逐渐混乱。

## 改进目标

新增管理员内部权限等级，不改变登录界面的角色选择。

管理员账号仍然通过普通 Admin 登录入口登录，但每个管理员账号对应一个权限等级：

```text
standard  普通管理员
director  总监管理员
```

登录成功后，权限等级应体现在个人信息界面或管理员首页中。

普通管理员主要负责：

- 关卡审核。
- 社区评论管理。

总监管理员主要负责：

- 界面 UI 美化管理。
- 页面组成和按钮表现调整。
- 新页面创建和配置。
- 关卡地图界面美化。
- 游戏中物体建模和表现优化。
- 设计师创作流程和界面优化。
- 后续新增的视觉、体验和创作工具相关能力。

总监管理员不负责社区交流管理。

## 对象改造方向

新增系统对象：

```text
AdminLevel = "standard" | "director"
```

扩展用户对象：

```text
BackendUser
├── id
├── username
├── displayName
├── role
├── adminLevel?
├── createdAt
└── updatedAt
```

约束规则：

- `role != admin` 时，`adminLevel` 为空。
- `role == admin` 时，`adminLevel` 必须存在。
- 普通管理员为 `standard`。
- 总监管理员为 `director`。

后续总监管理员相关配置建议新增独立对象，例如：

```text
UiCustomization
├── id
├── target
├── title
├── description
├── status
├── config
├── createdBy
├── createdAt
└── updatedAt
```

其中 `target` 可逐步扩展：

```text
home | designer | player | admin | game | map
```

`config` 初期可以保持为 JSON 配置，避免一开始为每类 UI 美化建立过细的数据表。

## 权限改造方向

后端需要在现有 `requireRole(admin)` 之外，新增管理员等级判断。

建议拆成：

```text
requireAdminLevel("standard")
requireAdminLevel("director")
requireAnyAdminLevel(...)
```

普通管理员接口：

```text
GET    /admin/comments
DELETE /admin/comments/:commentId
GET    /admin/submissions/pending
POST   /admin/submissions/:submissionId/review
```

总监管理员接口建议新建在独立命名空间：

```text
/admin/director/*
```

第一批可规划为：

```text
GET    /admin/director/customizations
POST   /admin/director/customizations
GET    /admin/director/customizations/:id
PATCH  /admin/director/customizations/:id
POST   /admin/director/customizations/:id/activate
POST   /admin/director/customizations/:id/archive
```

权限边界：

- 普通管理员不能访问 `/admin/director/*`。
- 总监管理员不能访问社区评论管理 API。
- 是否允许总监管理员审核关卡，需要在产品规则中明确。当前建议先不允许，保持职责清晰。

## 前端页面改造方向

登录界面不需要展示普通管理员和总监管理员的区别。

登录后根据 `BackendUser.adminLevel` 做页面分流。

建议管理员页面拆分为：

```text
/admin
/admin/review
/admin/community
/admin/director
/admin/director/ui-lab
/admin/director/level-map
/admin/director/game-objects
/admin/director/designer-workflow
```

普通管理员看到：

- 关卡审核。
- 社区管理。

总监管理员看到：

- UI 美化工作台。
- 地图界面配置。
- 游戏物体建模配置。
- 设计师创作流程优化。

总监管理员不显示社区管理入口。

## 实施步骤

### 1. 新增 AdminLevel

- 前端新增 `AdminLevelSchema`。
- 后端新增 `AdminLevel` sealed trait。
- API response schema 和 Scala encoder/decoder 同步。

### 2. 扩展 BackendUser

- 前端 `BackendUserSchema` 增加 `adminLevel`。
- 后端 `BackendUser` case class 增加 `adminLevel`。
- 用户 row、mapper、JDBC codec 同步修改。

### 3. 修改数据库结构

- `users` 表新增 `admin_level` 字段。
- 初始化 SQL 更新已有管理员。
- 新增总监管理员演示账号，例如：

```text
admin-director-1
role = admin
adminLevel = director
```

如果修改初始化 SQL 并需要重新执行，需要重置 Docker 数据卷：

```bash
docker compose down -v
docker compose up -d postgres
```

### 4. 增加后端权限工具

- 新增 `requireAdminLevel`。
- 普通管理员接口限制为 `standard`。
- 总监接口限制为 `director`。
- 非 admin 或 adminLevel 不匹配时返回 forbidden。

### 5. 前端个人信息展示管理员等级

- 个人信息页展示：

```text
管理员权限：普通管理员
管理员权限：总监管理员
```

- 玩家和设计师不显示该字段。

### 6. 拆分 Admin 页面入口

- 管理员首页根据 `adminLevel` 显示不同入口。
- 普通管理员保留审核和社区入口。
- 总监管理员进入 Director Dashboard。

### 7. 新增 Director Dashboard

第一版只做清晰入口，不急于完成复杂编辑能力。

建议入口：

- 页面 UI 美化。
- 关卡地图美化。
- 游戏物体建模。
- 设计师创作流程优化。
- 后续扩展入口。

### 8. 新增 UiCustomization 对象和 API

- 先完成列表、创建、编辑、启用、归档。
- 所有前端响应继续使用 Zod schema 校验。
- 后端返回结构保持 `ApiSuccess(data)` / `ApiFailure(error)`。

### 9. 逐步接入真实页面配置

建议顺序：

1. 地图界面配置。
2. 设计师创作界面配置。
3. 游戏物体视觉配置。
4. 通用按钮和页面组件风格配置。

## 验收标准

普通管理员：

- 能进入关卡审核页面。
- 能进入社区管理页面。
- 不能进入 `/admin/director`。
- 访问 `/admin/director/*` 返回 forbidden。

总监管理员：

- 能进入 `/admin/director`。
- 个人信息显示“总监管理员”。
- 看不到社区管理入口。
- 访问社区评论管理 API 返回 forbidden。

玩家和设计师：

- 原有登录、游玩、创作流程不受影响。

技术验证：

- `npm run check` 通过。
- `npm test` 通过。
- `sbt compile` 通过。
- 关键 API smoke test 通过，并确认前端 Zod schema 能解析后端真实响应。

## 当前建议

下一步不要直接做 UI 美化编辑器。应先完成管理员分级的对象、数据库、权限和页面分流。

稳定的实施顺序是：

```text
AdminLevel 对象
-> BackendUser 扩展
-> 数据库字段和 seed
-> 后端权限工具
-> 个人信息展示
-> Admin 页面分流
-> Director Dashboard
-> UiCustomization 对象和 API
-> 各类 UI 美化能力
```
