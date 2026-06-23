# Objects 层（领域模型）

各业务模块在 `src/<module>/objects/` 下定义 **纯数据 case class** 与 Circe 编解码 companion。HTTP 请求 DTO 放在 `api/.../body/`，表行模型放在 `tables/`，本目录不含 SQL 或路由逻辑。

前端镜像：`frontend/src/objects/`（见 `frontend/src/objects/ARCHITECTURE.md`）。

## 分层约定

| 层 | 路径 | 职责 |
| --- | --- | --- |
| objects | `<module>/objects/` | 领域对象、枚举、错误码对象 |
| api/body | `<module>/api/.../body/` | HTTP 请求体（可组合 objects 类型） |
| api/validation | `<module>/api/.../validation/` | 请求/领域校验（无 Express/http4s 依赖） |
| tables | `<module>/tables/` | `*Row` + Table 门面（存储层） |

## 模块与子包

### system/objects/

`UserRole`、`AdminLevel`、`LevelStatus`、`LevelTag`、`SubmissionStatus`、`ApiSuccess`、`ApiFailure`、`ErrorBody`、`HealthResponse` 等跨模块枚举与 API 包装。

### user/objects/

`BackendUser`、`UserProfile`、`UserProfileStats`；错误对象如 `BindBackendUserErrors`、`GetUserProfileErrors`。

### level/objects/

```text
level/objects/
├── level/          Level, LevelData, GameWorld
├── social/         Favorite, FavoriteWithLevel, Rating, LevelComment, RateLevelErrors
├── submission/     Submission, SubmissionWithLevel
├── inventory/      BirdPool, BirdInventory
├── terrain/        Position, Size, LevelGround, GroundLine, GroundBezier, LevelTerrain, …
└── errors/         CreateLevelErrors
```

### admin/objects/

```text
admin/objects/
├── submission/     ReviewedSubmission, ReviewAudit, ReviewSubmissionErrors
└── director/
    ├── permissions/       DirectorPermissionSummary, DirectorTransferResult, …
    └── level_assignment/
        ├── assignment/      LevelSlotAssignment, LevelSlotAssignmentDetail
        ├── board/           DirectorLevelAssignmentBoard, DirectorBirdPoolOption
        ├── LevelSlotCatalog.scala
        └── AssignLevelSlotErrors.scala
```

### bird/objects/

```text
bird/objects/
├── design/         BirdDesign, BirdDesignInput
├── submission/     BirdSubmission, BirdSubmissionWithDesign, ReviewedBirdSubmission
└── skill/
    ├── config/     BirdSkillConfig
    └── director/   DirectorBirdSkillEntry, DirectorBirdSkillBoard
```

### player/objects/

`ShopItem`、`PlayerWallet`、`PlayerRuntime`、`PlayerPreparation`、`PlayerSocialJson` 等运行时与 JSON 辅助类型。

### ui/objects/

```text
ui/objects/
├── component/      PageComponent ADT, ComponentPosition, ComponentStyle, ComponentAction, …
├── page/           PageConfig, PageLayout, SharedLevelMapPageId
├── button_template/  ButtonTemplate, ButtonTemplateSlice, ButtonTemplateScalingMode
├── category/       ButtonTemplateCategory, PanelTemplateCategory, PatternTemplateCategory
├── stretch_template/ StretchVisualTemplate, StretchVisualTemplateKind
├── UiEndpoint.scala
└── UiCustomizationErrors.scala
```

## 命名与文件

- 一个主要类型一个文件（或紧密相关的 trait + 子 case class 同文件，如 PageComponent ADT 的 codec 与 trait 同文件）。
- companion object 提供 `Encoder`/`Decoder`；Row 映射在 `tables/*RowMapper.scala`，不在 objects 内嵌 SQL。
- 子包名与领域一致：`assignment/`、`board/`、`skill/config/`、`skill/director/`，避免单文件堆叠多个无关 object。

## 与 tables 的边界

- **objects**：API 与业务语义（如 `Level.status: LevelStatus`）。
- **tables/*Row**：PostgreSQL 列一一对应（字符串 enum、JSON 文本等）。
- Table 门面负责 `Row ↔ objects`；APIMessage 只 import objects 与 tables 门面，不直接读 JDBC。
