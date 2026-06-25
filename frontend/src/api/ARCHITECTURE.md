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

业务 API 文件采用 sample 风格：文件内定义 `XxxAPI extends APIMessage/APIWithTokenMessage`，
字段与后端 `XxxAPIMessage` payload 对齐，调用方通过 `sendAPI(new XxxAPI(...))` 发送。统一发送、
鉴权 header、响应 envelope 解析放在 `frontend/src/system/api/`。未完全迁移到 class/message 风格的旧文件，
临时通过 `frontend/src/system/api/legacyRequest.ts` 兼容旧 `request(path, schema, options)` 调用。

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

## API 外围文件位置

| 文件 | 用途 |
| --- | --- |
| `frontend/src/system/api/exports/*.ts` | 可选聚合导出，如 `admin-api.ts`、`player-api.ts`、`index.ts` |
| `frontend/src/system/api/contracts.ts` | API envelope 成功/错误响应 schema |
| `frontend/src/objects/api/api-contracts.ts` | 旧调用方仍使用的领域响应/schema 汇总，后续可继续拆到各领域 `objects/` |
| `frontend/src/system/api/*test.ts` | API 结构与代理覆盖校验 |

`frontend/src/api/` 顶层不保留 `.ts` 散文件，只放与后端 `api/` 对齐的业务 API 子目录。
页面与 Hook 优先直接 import 子目录下的 `*Api.ts` 或共享 schema；确实需要聚合导出时，从
`system/api/exports/` 引用。

## 校验

`npm test` 会运行 `api-alignment.test.ts`：

- 扫描后端全部公开 `*Api.scala`，断言前端存在同布局的 `*Api.ts`
- 扫描后端 `<module>/objects/**/*.scala` 中的 `*Request.scala`，断言前端存在对应 `body/*Body.ts`
- 路径变换：`<module>/objects/<area>/XxxRequest.scala` → `<module>/<area>/body/XxxBody.ts`；例外见下

## HTTP 请求体（body/）

后端请求对象在 **`<module>/objects/<子域>/`**，不再单独使用 `body/` 目录。前端暂时仍把请求 schema 放在 **紧邻 `*Api.ts` 的 `body/` 子目录**，便于同域 import。

| 后端 | 前端 |
| --- | --- |
| `level/objects/design/request/CreateLevelRequest.scala` | `api/level/design/body/CreateLevelRequest.ts` |
| `level/objects/player/RateLevelRequest.scala` | `api/level/player/action/body/RateLevelRequest.ts` |
| `admin/objects/shop/CreateShopItemRequest.scala` | `api/admin/shop/body/CreateShopItemRequest.ts` |
| `ui/objects/pages/CreateUiPageRequest.scala` | `api/ui/pages/body/CreateUiPageBody.ts` |

通用规则：`backend/.../<module>/objects/<path>/XxxRequest.scala` → `frontend/src/api/<module>/<path>/body/XxxBody.ts`。  
**例外**：`level/objects/player/request/` 对应前端的 `level/player/action/body/`（与 `level/api/player/action/` 对齐）。

每个 body 文件导出 Zod schema 与类型。为减少调用方改动，`*Api.ts` 与
`objects/api/api-contracts.ts` 仍可使用既有名称（如 `CreateShopItemRequestBodySchema`），
可在 body 文件内作为 export alias 保留。

领域/响应模型在 `objects/`；前端 body 文件可 import `objects/` 中的嵌套 schema（如 `ButtonTemplateSchema`）。

后端模块目录全文见 [`backend/microservice/MODULE-LAYOUT.md`](../../../backend/microservice/MODULE-LAYOUT.md)。
