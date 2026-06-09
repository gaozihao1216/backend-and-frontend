package microservice.infrastructure.database

import microservice.auth.tables.user.UserRow
import microservice.level.objects.Favorite
import microservice.bird.tables.shared.{BirdDesignRow, BirdSubmissionRow}
import microservice.level.tables.shared.{CommentRow, LevelRow, LevelSlotAssignmentRow, RatingRow, SubmissionRow}
import microservice.player.runtime.{CheckInSlotReward, PlayerWallet, WeeklyCheckInProgress}
import microservice.player.tables.preparation.{PlayerBirdUpgradeRow, PlayerSlingshotUpgradeRow}
import microservice.player.tables.progress.{PlayerLegacyCheckInRow, PlayerLevelProgressRow}
import microservice.player.tables.shop.{ShopItemRow, ShopPurchaseRow}
import microservice.player.tables.social.{PlayerFriendRow, PlayerPrivateMessageRow}
import microservice.ui.tables.button_template.{ButtonTemplateRow}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateRow}
import microservice.ui.tables.ui_page.{UiPageRow}

object InMemoryStore {
  var users: Vector[UserRow] = Vector.empty
  var levels: Vector[LevelRow] = Vector.empty
  var ratings: Vector[RatingRow] = Vector.empty
  var comments: Vector[CommentRow] = Vector.empty
  var favorites: Vector[Favorite] = Vector.empty
  var submissions: Vector[SubmissionRow] = Vector.empty
  var levelSlotAssignments: Vector[LevelSlotAssignmentRow] = Vector.empty
  var uiPages: Vector[UiPageRow] = Vector.empty
  var buttonTemplates: Vector[ButtonTemplateRow] = Vector.empty
  var stretchVisualTemplates: Vector[StretchVisualTemplateRow] = Vector.empty
  var playerWallets: Map[String, PlayerWallet] = Map.empty
  var playerWeeklyCheckIn: Map[String, WeeklyCheckInProgress] = Map.empty
  var playerLevelProgress: Vector[PlayerLevelProgressRow] = Vector.empty
  var playerLegacyCheckIns: Vector[PlayerLegacyCheckInRow] = Vector.empty
  var checkInPanelRewards: Map[String, Vector[CheckInSlotReward]] = Map.empty
  var shopItems: Vector[ShopItemRow] = Vector.empty
  var shopPurchases: Vector[ShopPurchaseRow] = Vector.empty
  var playerFriends: Vector[PlayerFriendRow] = Vector.empty
  var playerPrivateMessages: Vector[PlayerPrivateMessageRow] = Vector.empty
  var playerBirdUpgrades: Vector[PlayerBirdUpgradeRow] = Vector.empty
  var playerSlingshotUpgrades: Vector[PlayerSlingshotUpgradeRow] = Vector.empty
  var birdDesigns: Vector[BirdDesignRow] = Vector.empty
  var birdSubmissions: Vector[BirdSubmissionRow] = Vector.empty

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
