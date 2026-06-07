package microservice.infrastructure.database

import microservice.auth.tables.UserRow
import microservice.level.objects.Favorite
import microservice.level.tables.{CommentRow, LevelRow, RatingRow, SubmissionRow}
import microservice.player.runtime.{CheckInSlotReward, PlayerWallet, WeeklyCheckInProgress}
import microservice.ui.tables.{ButtonTemplateRow, StretchVisualTemplateRow, UiPageRow}

object InMemoryStore {
  var users: Vector[UserRow] = Vector.empty
  var levels: Vector[LevelRow] = Vector.empty
  var ratings: Vector[RatingRow] = Vector.empty
  var comments: Vector[CommentRow] = Vector.empty
  var favorites: Vector[Favorite] = Vector.empty
  var submissions: Vector[SubmissionRow] = Vector.empty
  var uiPages: Vector[UiPageRow] = Vector.empty
  var buttonTemplates: Vector[ButtonTemplateRow] = Vector.empty
  var stretchVisualTemplates: Vector[StretchVisualTemplateRow] = Vector.empty
  var playerCheckInStatus: Map[String, String] = Map.empty
  var playerWallets: Map[String, PlayerWallet] = Map.empty
  var playerWeeklyCheckIn: Map[String, WeeklyCheckInProgress] = Map.empty
  var playerLevelProgress: Map[String, Set[String]] = Map.empty
  var checkInPanelRewards: Map[String, Vector[CheckInSlotReward]] = Map.empty

  def reset(
    nextUsers: Vector[UserRow],
    nextLevels: Vector[LevelRow],
    nextRatings: Vector[RatingRow],
    nextComments: Vector[CommentRow],
    nextFavorites: Vector[Favorite],
    nextSubmissions: Vector[SubmissionRow],
    nextUiPages: Vector[UiPageRow] = Vector.empty,
    nextButtonTemplates: Vector[ButtonTemplateRow] = Vector.empty,
    nextStretchVisualTemplates: Vector[StretchVisualTemplateRow] = Vector.empty
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
  }
}
