# 前端 API 目录约定

与 Scala 后端 `backend/microservice/src/<module>/api/` **子路径一一对应**；文件名与后端 `*Api.scala` 相同，扩展名为 `.ts`。

## 映射规则

| 后端路径 | 前端路径 |
| --- | --- |
| `admin/api/comments/DeleteCommentApi.scala` | `api/admin/comments/DeleteCommentApi.ts` |
| `level/api/player/read/GetPublishedLevelsApi.scala` | `api/level/player/read/GetPublishedLevelsApi.ts` |
| `bird/api/design/CreateBirdDesignApi.scala` | `api/bird/design/CreateBirdDesignApi.ts` |
| `player/api/social/ListFriendsApi.scala` | `api/player/social/ListFriendsApi.ts` |
| `ui/api/buttontemplates/ListButtonTemplatesApi.scala` | `api/ui/buttontemplates/ListButtonTemplatesApi.ts` |

所有业务 API 通过后端统一 RPC 入口调用：`POST /api/{apiName}`。`apiName` 由后端 `XxxAPIMessage`
推导为小写 `xxxapi`，例如 `BindBackendUserAPIMessage` → `/api/bindbackenduserapi`。

## 目录树（与后端模块对齐）

```text
api/
├── admin/
│   ├── comments/
│   ├── submissions/
│   └── director/
│       ├── permissions/
│       ├── level_assignment/
│       └── bird_skill/
├── bird/
│   ├── design/
│   └── review/
├── level/
│   ├── design/
│   └── player/
│       ├── read/
│       └── action/
├── player/
│   ├── social/
│   ├── preparation/
│   └── ui/
├── ui/
│   ├── pages/
│   ├── pagecomponents/
│   ├── buttontemplates/
│   ├── stretchtemplates/
│   └── panelworkflows/
├── user/
└── system/
```

## 聚合导出（可选快捷 import）

| 文件 | 用途 |
| --- | --- |
| `admin-api.ts` | Standard/Director 管理端 |
| `designer-api.ts` | 设计师关卡 + 鸟类 |
| `player-api.ts` | 玩家关卡读写 + social + preparation + ui runtime |
| `ui-api.ts` | 总监 UI 定制 |
| `user-api.ts` / `system-api.ts` | 用户绑定/资料、健康检查 |
| `index.ts` | 全量 re-export + `createDefaultLevelInput` |

旧路径 `player-social-api.ts`、`player-preparation-api.ts`、`player-ui-api.ts` 保留为 **兼容 re-export**，新代码请直接 import 子目录下的 `*Api.ts`。

## 校验

`npm test` 会运行 `api-alignment.test.ts`：

- 扫描后端全部公开 `*Api.scala`，断言前端存在同布局的 `*Api.ts`
- 扫描后端 `<module>/body/**/*.scala`（文件名 `*Body.scala`），断言前端存在对应 `body/*Body.ts`
- 路径变换：`<module>/body/<area>/XxxBody.scala` → `<module>/<area>/body/XxxBody.ts`；例外见下

## HTTP 请求体（body/）

后端请求 DTO 在 **`<module>/body/<子域>/`**（与 `api/` 同级），不在 `api/.../body/` 下。前端仍把 body 放在 **紧邻 `*Api.ts` 的 `body/` 子目录**，便于同域 import。

| 后端 | 前端 |
| --- | --- |
| `level/body/design/CreateLevelBody.scala` | `api/level/design/body/CreateLevelBody.ts` |
| `level/body/player/RateLevelBody.scala` | `api/level/player/action/body/RateLevelBody.ts` |
| `admin/body/shop/CreateShopItemBody.scala` | `api/admin/shop/body/CreateShopItemBody.ts` |
| `ui/body/pages/CreateUiPageBody.scala` | `api/ui/pages/body/CreateUiPageBody.ts` |

通用规则：`backend/.../<module>/body/<path>/XxxBody.scala` → `frontend/src/api/<module>/<path>/body/XxxBody.ts`。  
**例外**：`level/body/player/` 对应前端的 `level/player/action/body/`（与 `level/api/player/action/` 对齐）。

每个 body 文件导出 Zod schema 与类型。为减少调用方改动，`*Api.ts` 与 `api-contracts.ts` 仍可使用既有名称（如 `CreateShopItemRequestBodySchema`），可在 body 文件内作为 export alias 保留。

领域/响应模型仍在 `objects/`；body 文件可 import `objects/` 中的嵌套 schema（如 `ButtonTemplateSchema`）。

后端模块目录全文见 [`backend/microservice/MODULE-LAYOUT.md`](../../../backend/microservice/MODULE-LAYOUT.md)。
