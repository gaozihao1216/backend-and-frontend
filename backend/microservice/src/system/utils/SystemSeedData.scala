package microservice.system.utils

import microservice.auth.tables.UserRow
import microservice.infrastructure.database.InMemoryStore
import microservice.level.objects._
import microservice.level.tables.{CommentRow, LevelRow, RatingRow, SubmissionRow}
import microservice.system.objects.{AdminLevel, LevelStatus, LevelTag, SubmissionStatus, UserRole}

private[utils] object SystemSeedData {
  def reset(createdAt: String, reviewedAt: String): Unit =
    InMemoryStore.reset(
      nextUsers = users(createdAt),
      nextLevels = levels(createdAt),
      nextRatings = Vector(RatingRow("rating-1", "level-1", "player-1", 4, createdAt, createdAt)),
      nextComments = Vector(CommentRow("comment-1", "level-1", "player-1", "Solid tutorial pacing.", createdAt)),
      nextFavorites = Vector.empty,
      nextSubmissions = submissions(createdAt, reviewedAt)
    )

  private def users(createdAt: String): Vector[UserRow] =
    Vector(
      UserRow("player-1", "local-player-0000001", "Player One", UserRole.Player, None, createdAt, createdAt),
      UserRow("designer-1", "local-designer-0000002", "Designer One", UserRole.Designer, None, createdAt, createdAt),
      UserRow("admin-1", "local-admin-0000003", "Admin One", UserRole.Admin, Some(AdminLevel.Standard), createdAt, createdAt),
      UserRow("admin-director-1", "local-admin-director-0000004", "Director Admin", UserRole.Admin, Some(AdminLevel.Director), createdAt, createdAt)
    )

  private def levels(createdAt: String): Vector[LevelRow] =
    Vector(
      LevelRow(
        id = "level-1",
        title = "Starter Siege",
        description = "Published sample level for profile and rating demos.",
        tags = List(LevelTag.Beginner, LevelTag.Puzzle),
        data = demoLevelData,
        authorId = "designer-1",
        status = LevelStatus.Published,
        rejectionReason = None,
        averageRating = 4.0,
        ratingCount = 1,
        createdAt = createdAt,
        updatedAt = createdAt,
        publishedAt = Some(createdAt)
      ),
      LevelRow(
        id = "level-2",
        title = "Pending Glass Tower",
        description = "Pending review sample for admin demo.",
        tags = List(LevelTag.Hard),
        data = demoLevelData,
        authorId = "designer-1",
        status = LevelStatus.PendingReview,
        rejectionReason = None,
        averageRating = 0,
        ratingCount = 0,
        createdAt = createdAt,
        updatedAt = createdAt,
        publishedAt = None
      )
    )

  private def submissions(createdAt: String, reviewedAt: String): Vector[SubmissionRow] =
    Vector(
      SubmissionRow(
        id = "submission-1",
        levelId = "level-1",
        submitterId = "designer-1",
        status = SubmissionStatus.Approved,
        reviewerId = Some("admin-1"),
        reviewNote = Some("Published as baseline sample."),
        submittedAt = createdAt,
        reviewedAt = Some(reviewedAt)
      ),
      SubmissionRow(
        id = "submission-2",
        levelId = "level-2",
        submitterId = "designer-1",
        status = SubmissionStatus.PendingReview,
        reviewerId = None,
        reviewNote = None,
        submittedAt = createdAt,
        reviewedAt = None
      )
    )

  private val demoLevelData = LevelData(
    world = GameWorld(width = 1600, height = 900, gravity = 1.0),
    ground = Some(GroundLine(points = List(Position(0, 760), Position(1600, 760)))),
    terrain = None,
    birdInventory = BirdInventory(basic = 3),
    obstacles = List(LevelObstacle("obstacle-1", "wood", Position(960, 650), Size(120, 30), Some(0))),
    enemies = List(LevelEnemy("enemy-1", "pig", Position(1020, 610), Some(Size(48, 48))))
  )
}
