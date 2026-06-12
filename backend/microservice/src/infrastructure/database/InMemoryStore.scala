package microservice.infrastructure.database

import microservice.user.tables.user.UserRow
import microservice.level.objects.Favorite
import microservice.bird.tables.shared.{BirdDesignRow, BirdSubmissionRow}
import microservice.level.tables.shared.{CommentRow, LevelRow, LevelSlotAssignmentRow, RatingRow, SubmissionRow}
import microservice.player.objects.{CheckInSlotReward, PlayerWallet, WeeklyCheckInProgress}
import microservice.player.tables.preparation.{PlayerBirdUpgradeRow, PlayerSlingshotUpgradeRow}
import microservice.player.tables.progress.{PlayerLegacyCheckInRow, PlayerLevelProgressRow}
import microservice.player.tables.shop.{ShopItemRow, ShopPurchaseRow}
import microservice.player.tables.social.{PlayerFriendRow, PlayerPrivateMessageRow}
import microservice.ui.tables.button_template.{ButtonTemplateRow}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRow}
import microservice.ui.tables.ui_page.{UiPageRow}

/** in-memory 模式下的进程内全局存储。
  *
  * 实现：各 Table 在 connection == null 时读写此 object 中的可变集合，模拟数据库表。
  * 关联：[[SystemSeedData]] / [[PlayerRuntimeSeed]] 在启动时调用 reset 注入演示数据；
  *       [[DatabaseSession.inMemory]] 向 APIMessage 传入 null Connection 以路由到此存储。
  */
object InMemoryStore {
  // --- 用户与 UGC 核心实体 ---
  var users: Vector[UserRow] = Vector.empty                         // 用户表
  var levels: Vector[LevelRow] = Vector.empty                       // 关卡表
  var ratings: Vector[RatingRow] = Vector.empty                     // 关卡评分
  var comments: Vector[CommentRow] = Vector.empty                   // 关卡评论
  var favorites: Vector[Favorite] = Vector.empty                    // 玩家收藏
  var submissions: Vector[SubmissionRow] = Vector.empty             // 关卡提交流水
  var levelSlotAssignments: Vector[LevelSlotAssignmentRow] = Vector.empty // 总监配置的关卡槽位

  // --- UI 定制模板 ---
  var uiPages: Vector[UiPageRow] = Vector.empty
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

  /** 批量重置核心演示表；玩家运行时等扩展表由 [[PlayerRuntimeSeed]] 单独初始化。 */
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
    uiPages = nextUiPages
    buttonTemplates = nextButtonTemplates
    stretchVisualTemplates = nextStretchVisualTemplates
    levelSlotAssignments = nextLevelSlotAssignments
  }
}
