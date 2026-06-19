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

**例外（历史路由前缀，非模块路径）：**

| 后端 | 前端 |
| --- | --- |
| `user/api/GetBackendUsersApi.scala` | `api/auth/GetBackendUsersApi.ts`（挂载 `/auth/backend-users`） |
| `user/api/BindBackendUserApi.scala` | `api/auth/BindBackendUserApi.ts`（挂载 `/auth/bind`） |

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
├── auth/          # user 模块中挂载在 /auth 的 API
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
| `auth-api.ts` / `user-api.ts` / `system-api.ts` | 认证、资料、健康检查 |
| `index.ts` | 全量 re-export + `createDefaultLevelInput` |

旧路径 `player-social-api.ts`、`player-preparation-api.ts`、`player-ui-api.ts` 保留为 **兼容 re-export**，新代码请直接 import 子目录下的 `*Api.ts`。

## 校验

`npm test` 会运行 `api-alignment.test.ts`：扫描后端全部 `*Api.scala`，断言前端存在同布局的 `*Api.ts`（含上述 auth 例外）。
