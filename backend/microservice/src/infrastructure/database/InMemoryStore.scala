package microservice.infrastructure.database

import microservice.user.tables.user.UserRow
import microservice.bird.tables.shared.{BirdDesignRow, BirdSubmissionRow}
import microservice.bird.tables.skill_config.BirdSkillConfigRow
import microservice.admin.tables.ReviewAuditRow
import microservice.level.tables.shared.{
  CommentRow,
  FavoriteRow,
  LevelRow,
  LevelSlotAssignmentRow,
  RatingRow,
  SubmissionRow
}
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardRow
import microservice.player.tables.preparation.{PlayerBirdUpgradeRow, PlayerSlingshotUpgradeRow}
import microservice.player.tables.progress.{PlayerLegacyCheckInRow, PlayerLevelProgressRow}
import microservice.player.tables.shop.{ShopItemRow, ShopPurchaseRow}
import microservice.player.tables.social.{PlayerFriendRow, PlayerPrivateMessageRow}
import microservice.player.tables.wallet.PlayerWalletRow
import microservice.player.tables.weekly_check_in.PlayerWeeklyCheckInRow
import microservice.ui.tables.button_template.{ButtonTemplateRow}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRow}
import microservice.ui.tables.ui_page.{UiPageRow}

/** in-memory 模式下的进程内全局可变存储（模拟关系型数据库各表）。 */
object InMemoryStore {
  var users: Vector[UserRow] = Vector.empty
  var levels: Vector[LevelRow] = Vector.empty
  var ratings: Vector[RatingRow] = Vector.empty
  var comments: Vector[CommentRow] = Vector.empty
  var favorites: Vector[FavoriteRow] = Vector.empty
  var submissions: Vector[SubmissionRow] = Vector.empty
  var reviewAudits: Vector[ReviewAuditRow] = Vector.empty
  var levelSlotAssignments: Vector[LevelSlotAssignmentRow] = Vector.empty

  var uiPages: Vector[UiPageRow] = Vector.empty
  var uiPageRollbacks: Vector[microservice.ui.tables.ui_page_rollback.UiPageRollbackRow] = Vector.empty
  var buttonTemplates: Vector[ButtonTemplateRow] = Vector.empty
  var stretchVisualTemplates: Vector[StretchVisualTemplateRow] = Vector.empty

  var playerWallets: Map[String, PlayerWalletRow] = Map.empty
  var playerWeeklyCheckIn: Map[String, PlayerWeeklyCheckInRow] = Map.empty
  var playerLevelProgress: Vector[PlayerLevelProgressRow] = Vector.empty
  var playerLegacyCheckIns: Vector[PlayerLegacyCheckInRow] = Vector.empty
  var checkInPanelRewards: Map[String, Vector[CheckInPanelRewardRow]] = Map.empty

  var shopItems: Vector[ShopItemRow] = Vector.empty
  var shopPurchases: Vector[ShopPurchaseRow] = Vector.empty
  var playerFriends: Vector[PlayerFriendRow] = Vector.empty
  var playerPrivateMessages: Vector[PlayerPrivateMessageRow] = Vector.empty

  var playerBirdUpgrades: Vector[PlayerBirdUpgradeRow] = Vector.empty
  var playerSlingshotUpgrades: Vector[PlayerSlingshotUpgradeRow] = Vector.empty
  var birdDesigns: Vector[BirdDesignRow] = Vector.empty
  var birdSubmissions: Vector[BirdSubmissionRow] = Vector.empty
  var birdSkillConfigs: Vector[BirdSkillConfigRow] = Vector.empty

  def reset(
    nextUsers: Vector[UserRow],
    nextLevels: Vector[LevelRow],
    nextRatings: Vector[RatingRow],
    nextComments: Vector[CommentRow],
    nextFavorites: Vector[FavoriteRow],
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
