package microservice.infrastructure.database

import microservice.user.tables.user.UserRow
import microservice.level.objects.social.Favorite
import microservice.bird.tables.shared.{BirdDesignRow, BirdSubmissionRow}
import microservice.bird.tables.skill_config.BirdSkillConfigRow
import microservice.admin.tables.ReviewAuditRow
import microservice.level.tables.shared.{CommentRow, LevelRow, LevelSlotAssignmentRow, RatingRow, SubmissionRow}
import microservice.player.objects.{CheckInSlotReward, PlayerWallet, WeeklyCheckInProgress}
import microservice.player.tables.preparation.{PlayerBirdUpgradeRow, PlayerSlingshotUpgradeRow}
import microservice.player.tables.progress.{PlayerLegacyCheckInRow, PlayerLevelProgressRow}
import microservice.player.tables.shop.{ShopItemRow, ShopPurchaseRow}
import microservice.player.tables.social.{PlayerFriendRow, PlayerPrivateMessageRow}
import microservice.ui.tables.button_template.{ButtonTemplateRow}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRow}
import microservice.ui.tables.ui_page.{UiPageRow}

/** in-memory 模式下的进程内全局可变存储（模拟关系型数据库各表）。
  *
  * == 激活条件 ==
  * 当 `UGC_DATABASE_MODE` 非 `jdbc` 时，[[DatabaseSession.inMemory]] 向 APIMessage 传入 `null` Connection；
  * 各 `*Table` 对象检测 `connection == null` 后读写本 object 中的 `var` 集合。
  *
  * == 与 JDBC 模式的对称 ==
  * Table 层 API 签名在两种模式下相同（均接受 `Connection`），仅底层存储实现不同，
  * 从而业务 APIMessage 无需分支判断数据库模式。
  *
  * == 数据生命周期 ==
  * - 启动时：`SystemSeedData` / `PlayerRuntimeSeed` 调用 [[reset]] 及玩家表初始化注入演示数据；
  * - 运行时：所有写操作直接修改 `var`，进程重启后数据丢失（符合开发/测试预期）。
  *
  * == 线程安全 ==
  * 当前为单进程单线程 IO 模型下的可变状态；若未来多 fiber 并发写同一表，须加同步或改为 Ref。
  *
  * == 关联 ==
  * - [[DatabaseSession.inMemory]]：传入 null Connection 的会话实现
  * - `microservice.system.utils.SystemSeedData`：核心 UGC 种子数据
  */
object InMemoryStore {
  // --- 用户与 UGC 核心实体 ---
  var users: Vector[UserRow] = Vector.empty                         // 用户表
  var levels: Vector[LevelRow] = Vector.empty                       // 关卡表
  var ratings: Vector[RatingRow] = Vector.empty                     // 关卡评分
  var comments: Vector[CommentRow] = Vector.empty                   // 关卡评论
  var favorites: Vector[Favorite] = Vector.empty                    // 玩家收藏
  var submissions: Vector[SubmissionRow] = Vector.empty             // 关卡提交流水
  var reviewAudits: Vector[ReviewAuditRow] = Vector.empty           // 管理员审核审计
  var levelSlotAssignments: Vector[LevelSlotAssignmentRow] = Vector.empty // 总监配置的关卡槽位

  // --- UI 定制模板 ---
  var uiPages: Vector[UiPageRow] = Vector.empty
  var uiPageRollbacks: Vector[microservice.ui.tables.ui_page_rollback.UiPageRollbackRow] = Vector.empty
  var buttonTemplates: Vector[ButtonTemplateRow] = Vector.empty
  var stretchVisualTemplates: Vector[StretchVisualTemplateRow] = Vector.empty

  // --- 玩家运行时状态 ---
  var playerWallets: Map[String, PlayerWallet] = Map.empty          // userId → 钱包
  var playerWeeklyCheckIn: Map[String, WeeklyCheckInProgress] = Map.empty
  var playerLevelProgress: Vector[PlayerLevelProgressRow] = Vector.empty
  var playerLegacyCheckIns: Vector[PlayerLegacyCheckInRow] = Vector.empty
  var checkInPanelRewards: Map[String, Vector[CheckInSlotReward]] = Map.empty // panelId → 签到奖励槽

  // --- 商店与社交 ---
  var shopItems: Vector[ShopItemRow] = Vector.empty
  var shopPurchases: Vector[ShopPurchaseRow] = Vector.empty
  var playerFriends: Vector[PlayerFriendRow] = Vector.empty
  var playerPrivateMessages: Vector[PlayerPrivateMessageRow] = Vector.empty

  // --- 备战升级与鸟类设计 ---
  var playerBirdUpgrades: Vector[PlayerBirdUpgradeRow] = Vector.empty
  var playerSlingshotUpgrades: Vector[PlayerSlingshotUpgradeRow] = Vector.empty
  var birdDesigns: Vector[BirdDesignRow] = Vector.empty
  var birdSubmissions: Vector[BirdSubmissionRow] = Vector.empty
  var birdSkillConfigs: Vector[BirdSkillConfigRow] = Vector.empty

  /** 批量重置核心演示表（用户、关卡、评分、评论、收藏、提交、UI 模板、关卡槽位）。
    *
    * 玩家运行时扩展表（钱包、商店、社交等）由 `PlayerRuntimeSeed` 单独初始化，不在此方法内覆盖。
    * 调用方通常在应用启动、`SystemSeedData.apply` 流程中执行。
    *
    * @param nextUiPages 可选 UI 页面种子，默认空
    * @param nextButtonTemplates 可选按钮模板种子
    * @param nextStretchVisualTemplates 可选拉拽视觉模板种子
    * @param nextLevelSlotAssignments 可选总监关卡槽位分配
    */
  def reset(
    nextUsers: Vector[UserRow],
    nextLevels: Vector[LevelRow],
    nextRatings: Vector[RatingRow],
    nextComments: Vector[CommentRow],
    nextFavorites: Vector[Favorite],
    nextSubmissions: Vector[SubmissionRow],
    nextUiPages: Vector[UiPageRow] = Vector.empty,
    nextButtonTemplates: Vector[ButtonTemplateRow] = Vector.empty,
    nextStretchVisualTemplates: Vector[StretchVisualTemplateRow] = Vector.empty,
    nextLevelSlotAssignments: Vector[LevelSlotAssignmentRow] = Vector.empty
  ): Unit = {
    users = nextUsers
    levels = nextLevels
    ratings = nextRatings
    comments = nextComments
    favorites = nextFavorites
    submissions = nextSubmissions
    reviewAudits = Vector.empty
    uiPages = nextUiPages
    uiPageRollbacks = Vector.empty
    buttonTemplates = nextButtonTemplates
    stretchVisualTemplates = nextStretchVisualTemplates
    levelSlotAssignments = nextLevelSlotAssignments
  }
}
