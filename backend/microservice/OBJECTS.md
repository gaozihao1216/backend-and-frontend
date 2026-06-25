# Objects 层（领域模型）

各业务模块在 `src/<module>/objects/` 下定义 **纯数据 case class** 与 Circe 编解码 companion。

- HTTP 请求对象也归入 `<module>/objects/`（见 [`MODULE-LAYOUT.md`](./MODULE-LAYOUT.md)）
- **表行** → `<module>/tables/*Row`
- 本目录不含 SQL、路由；请求对象可提供 `EntityDecoder`

前端镜像：`frontend/src/objects/`（见 `frontend/src/objects/ARCHITECTURE.md`）。

## 分层约定

| 层 | 路径 | 职责 |
| --- | --- | --- |
| objects | `<module>/objects/` | 领域对象、枚举、错误码、API 返回类型、请求对象 |
| validation | `<module>/validation/<子域>` | 对请求对象/字段的校验（无 DB） |
| support | `<module>/support/<子域>/` | 查表与状态规则（可读 `Connection`） |
| api | `<module>/api/<子域>/` | 仅 `*Api.scala`，编排 plan |
| tables | `<module>/tables/` | `*Row` + Table 门面 |

**请求对象与其他 objects 的边界**

| 类型 | 职责 |
| --- | --- |
| `Level`、`BirdDesign`、`CreateLevelErrors` | 领域内语义、API 返回、错误码 |
| `CreateLevelRequest` 等请求对象 | 入站 HTTP JSON，可提供 `EntityDecoder`，由 api/validation 引用 |

**objects 与 tables 的边界**

- **objects**：API 与业务语义（如 `Level.status: LevelStatus`）。
- **tables/*Row**：PostgreSQL 列一一对应（字符串 enum、JSON 文本等）。
- Table 门面负责 `Row ↔ objects`；APIMessage 只 import objects 与 tables 门面，不直接读 JDBC。

## 模块与子包

### system/objects/

```text
system/objects/
├── enums/          UserRole, AdminLevel, LevelStatus, LevelTag, SubmissionStatus, AuditTargetType
├── api/            ApiSuccess, ApiFailure, ErrorBody
└── health/         HealthResponse
```

### user/objects/

```text
user/objects/
├── identity/       BackendUser, BindBackendUserRequest, BindBackendUserErrors
├── profile/        UserProfile, UserProfileStats, UserProfilePublishedLevel, GetUserProfileErrors
└── handoff/        DirectorAdminLevelTransferResult, UserDisplaySummary
```

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

```text
player/objects/
├── shop/           ShopItem
├── wallet/         PlayerWallet
├── checkin/        CheckInSlotReward, WeeklyCheckInProgress
├── preparation/    PlayerPreparationResponse, BirdUpgradeView, BirdSkillConfigView, PlayerPreparationJson
├── social/         PlayerFriendSummary, PlayerPrivateMessageView, PlayerSocialJson
└── catalog/        PreparationPublishedBirdSnapshot, PreparationSystemBirdSnapshot
```

### ui/objects/

```text
ui/objects/
├── component/      PageComponent ADT, ComponentPosition, ComponentStyle, ComponentAction, …
├── page/           PageConfig, PageLayout, SharedLevelMapPageId
├── button_template/  ButtonTemplate, ButtonTemplateSlice, ButtonTemplateScalingMode
├── category/       ButtonTemplateCategory, PanelTemplateCategory, PatternTemplateCategory
├── stretch_template/ StretchVisualTemplate, StretchVisualTemplateKind
├── endpoint/       UiEndpoint
└── errors/         UiCustomizationErrors
```

## 命名与文件

- 一个主要类型一个文件（或紧密相关的 trait + 子 case class 同文件，如 PageComponent ADT 的 codec 与 trait 同文件）。
- companion object 提供 `Encoder`/`Decoder`；Row 映射在 `tables/*RowMapper.scala`，不在 objects 内嵌 SQL。
- 子包名与领域一致：`assignment/`、`board/`、`skill/config/`、`skill/director/`，避免单文件堆叠多个无关 object。

## 伴生 object 可见性

各业务模块 `objects/` 下的伴生 `object` 使用 **`private[<模块名>]`**，将 codec、`from*` 工厂等限制在本模块内，避免微服务之间直接调用对方 object 成员：

```scala
private[level] object Level {
  implicit val encoder: Encoder[Level] = deriveEncoder
  ...
}
```

| 模块 | 修饰符 | 说明 |
| --- | --- | --- |
| `level` | `private[level]` | 全模块可见（`microservice.level.*`） |
| `admin` / `user` / `bird` / `ui` / `player` | `private[admin]` 等 | 同上 |
| `system/objects` | **无**（public） | 跨模块共享枚举与 `ApiSuccess` 等 |

**Scala 注意点**

1. `private[level]` 中的 `level` 是**包名**，不是路径。原包 `microservice.level.objects.level` 会与模块名冲突，已重命名为 **`microservice.level.objects.core`**（`Level`、`LevelData`、`GameWorld`）。
2. 伴生 object 私有化后，**其他模块仍可使用 case class 类型**，但**不能**调用 `SubmissionWithLevel.from`、`LevelData(...)`（apply 在伴生 object 上）或自动推导嵌套类型的 Circe `Encoder`。
3. `system` 种子数据若需构造 `level` 领域对象，属于跨模块耦合，需单独处理（见下表）。

### 当前跨模块 `objects` 耦合（需你决定如何改）

**说明**：`case class` 类型引用仍合法；下列为**伴生 object 能力**（工厂方法、codec、apply）被阻断后会编译失败或需改设计的点。

#### 1. `admin` → `level`（13 处类型引用 + 3 处伴生调用）

| 用途 | 位置 | 用到的 level 类型 / 伴生 |
| --- | --- | --- |
| 评论管理 | `admin/api/comments/*`, `support/comments/AdminCommentAccess` | `LevelComment` |
| 投稿审核列表 | `admin/api/submissions/GetPendingSubmissionsApi` | `SubmissionWithLevel.from(...)` |
| 总监槽位看板 | `admin/support/director/level_assignment/DirectorLevelAssignmentSupport` | `SubmissionWithLevel.from(...)` |
| 槽位分配 DTO | `admin/objects/.../LevelSlotAssignment*`、`AssignLevelSlotRequest` | 字段类型 `BirdPool`、`SubmissionWithLevel`；Circe 需 `Encoder[BirdPool]` |
| 审核响应 | `admin/objects/submission/ReviewedSubmission` | `Submission` + `fromSubmission`（admin 内部） |

**可选改法**：在 admin 定义自己的 DTO；或 level 暴露只读 API/公开 codec 门面；或抽共享 `contract` 包。

#### 2. `admin` → `bird`（4 处）

| 位置 | 类型 |
| --- | --- |
| `admin/api/director/bird_skill/*` | `DirectorBirdSkillEntry`、`DirectorBirdSkillBoard`、`BirdSkillConfig` |
| `admin/support/director/bird_skill/DirectorBirdSkillSupport` | 同上 |

#### 3. `admin` → `player`（5 处）

| 位置 | 类型 |
| --- | --- |
| `admin/api/shop/*`, `support/shop/AdminShopSupport` | `ShopItem` |

#### 4. `user` → `level`（2 处类型 + Circe）

| 位置 | 说明 |
| --- | --- |
| `user/objects/profile/UserProfile.scala` | 字段 `List[Level]`、`List[LevelComment]`；`deriveEncoder` 需要 level 模块的 `Encoder` |

#### 5. `ui` → `player`（3 处）

| 位置 | 类型 |
| --- | --- |
| `ui/api/panelworkflows/RegisterCheckInPanelRewardsApi` | `CheckInSlotReward` |
| `ui/objects/panelworkflows/RegisterCheckInPanelRewardsRequest` | 同上 |
| `ui/support/panelworkflows/CheckInPanelAccess` | 同上 |

另：`RegisterCheckInPanelRewardsApi` 还通过 player internal API 调用签到奖励注册。

#### 6. `system` → `level` / `player` / `ui`（种子数据）

| 文件 | 依赖 |
| --- | --- |
| `system/utils/SystemDemoData.scala` | 构造 `LevelData`、`GameWorld`、`BirdInventory` 等（需 level 伴生 apply） |
| `system/utils/SystemJdbcSeedData.scala` | `CheckInSlotReward` |
| `system/utils/SystemUiTemplateSeedData.scala` | 多种 `ui.objects.*` 类型 |

`system` 作为启动种子层，通常保留 public 或改为各模块自管 seed。

#### 7. `infrastructure` → `level` / `player`

| 文件 | 依赖 |
| --- | --- |
| `infrastructure/database/InMemoryStore.scala` | `level.objects.social.Favorite`、`player.objects.*` |

---

当前 `sbt compile` 会因上述 **admin→level 伴生调用**、**admin→level codec**、**user→level codec**、**system 种子构造** 失败，直至你选定改法。
