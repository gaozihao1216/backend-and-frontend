package microservice.core

import microservice.routes.ApiRouter
import microservice.admin.api.{AdminReviewService, ReviewSubmissionRequest, ReviewSubmissionResponse}
import microservice.admin.objects.ReviewedSubmission
import microservice.auth.api.{AuthService, BindBackendUserRequest, BindBackendUserResponse}
import microservice.auth.objects.BackendUser
import microservice.auth.tables.UserRow
import microservice.level.api._
import microservice.level.objects._
import microservice.level.tables.{CommentRow, LevelRow, RatingRow, SubmissionRow}
import microservice.system.objects.{LevelStatus, LevelTag, SubmissionStatus, UserRole}
import microservice.user.api.{GetUserProfileRequest, GetUserProfileResponse, UserService}
import microservice.user.objects.{UserProfile, UserProfileStats}
import org.http4s.HttpRoutes

object SystemDefaults {
  val databaseConfig: DatabaseConfig =
    DatabaseConfig(
      driver = "org.postgresql.Driver",
      url = "jdbc:postgresql://localhost:5432/ugc_level_platform",
      schema = "public"
    )

  val databaseSession: DatabaseSession =
    DatabaseSession.inMemory(databaseConfig)

  private val demoLevelData = LevelData(
    world = GameWorld(width = 1600, height = 900, gravity = 1.0),
    ground = Some(GroundLine(points = List(Position(0, 760), Position(1600, 760)))),
    terrain = None,
    birdInventory = BirdInventory(basic = 3),
    obstacles = List(LevelObstacle("obstacle-1", "wood", Position(960, 650), Size(120, 30), Some(0))),
    enemies = List(LevelEnemy("enemy-1", "pig", Position(1020, 610), Some(Size(48, 48))))
  )

  private val createdAt = "2026-05-26T09:00:00Z"
  private val reviewedAt = "2026-05-26T10:00:00Z"

  private var users: Vector[UserRow] = Vector(
    UserRow("player-1", "local-player-0000001", "Player One", UserRole.Player, createdAt, createdAt),
    UserRow("designer-1", "local-designer-0000002", "Designer One", UserRole.Designer, createdAt, createdAt),
    UserRow("admin-1", "local-admin-0000003", "Admin One", UserRole.Admin, createdAt, createdAt)
  )

  private var levels: Vector[LevelRow] = Vector(
    LevelRow(
      id = "level-1",
      title = "Starter Siege",
      description = "Published sample level for profile and rating demos.",
      tags = List(microservice.system.objects.LevelTag.Beginner, microservice.system.objects.LevelTag.Puzzle),
      data = demoLevelData,
      authorId = "designer-1",
      status = LevelStatus.Published,
      rejectionReason = None,
      averageRating = 4.0,
      ratingCount = 1,
      createdAt = createdAt,
      updatedAt = createdAt,
      publishedAt = Some(createdAt)
    )
  )

  private var ratings: Vector[RatingRow] = Vector(
    RatingRow("rating-1", "level-1", "player-1", 4, createdAt, createdAt)
  )

  private var comments: Vector[CommentRow] = Vector(
    CommentRow("comment-1", "level-1", "player-1", "Solid tutorial pacing.", createdAt)
  )

  private var favorites: Vector[Favorite] = Vector.empty

  private var submissions: Vector[SubmissionRow] = Vector(
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

  levels = levels :+ LevelRow(
    id = "level-2",
    title = "Pending Glass Tower",
    description = "Pending review sample for admin demo.",
    tags = List(microservice.system.objects.LevelTag.Hard),
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

  private def toBackendUser(row: UserRow): BackendUser =
    BackendUser(row.id, row.username, row.displayName, row.role, row.createdAt, row.updatedAt)

  private def toLevel(row: LevelRow): Level =
    Level(
      row.id,
      row.title,
      row.description,
      row.tags,
      row.data,
      row.authorId,
      row.status,
      row.rejectionReason,
      row.averageRating,
      row.ratingCount,
      row.createdAt,
      row.updatedAt,
      row.publishedAt
    )

  private def toRating(row: RatingRow): Rating =
    Rating(row.id, row.levelId, row.playerId, row.score, row.createdAt, row.updatedAt)

  private def toComment(row: CommentRow): LevelComment =
    LevelComment(row.id, row.levelId, row.userId, row.content, row.createdAt)

  private def toSubmission(row: SubmissionRow): Submission =
    Submission(
      row.id,
      row.levelId,
      row.submitterId,
      row.status,
      row.reviewerId,
      row.reviewNote,
      row.submittedAt,
      row.reviewedAt
    )

  val authService: AuthService = new AuthService {
    override def getBackendUsers: Either[HttpError, List[BackendUser]] =
      Right(users.map(toBackendUser).toList)

    override def bindBackendUser(request: BindBackendUserRequest): Either[HttpError, BindBackendUserResponse] =
      if (request.localUserId.trim.isEmpty || request.nickname.trim.isEmpty) {
        Left(AuthService.BindBackendUserValidation(List("localUserId", "nickname")).toHttpError)
      } else {
        val normalizedNickname = request.nickname.trim
        val suffix = math.abs(request.localUserId.trim.hashCode).toString.take(7).reverse.padTo(7, '0').reverse
        val username = s"local-${request.role.value}-$suffix"
        val existing = users.find(_.username == username)

        val resolvedUser = existing.getOrElse {
          val timestamp = "2026-05-26T11:00:00Z"
          val user = UserRow(
            id = s"${request.role.value}-${users.count(_.role == request.role) + 1}",
            username = username,
            displayName = normalizedNickname,
            role = request.role,
            createdAt = timestamp,
            updatedAt = timestamp
          )
          users = users :+ user
          user
        }

        Right(BindBackendUserResponse(toBackendUser(resolvedUser)))
      }
  }

  val userService: UserService = new UserService {
    override def getUserProfile(request: GetUserProfileRequest): Either[HttpError, GetUserProfileResponse] =
      users.find(_.id == request.userId) match {
        case None =>
          Left(UserService.UserMissing(request.userId).toHttpError)
        case Some(user) =>
          val profile = UserProfile(
            user = toBackendUser(user),
            publishedLevels = levels.filter(level => level.authorId == user.id && level.status == LevelStatus.Published).map(toLevel).toList,
            recentComments = comments.filter(_.userId == user.id).sortBy(_.createdAt)(Ordering[String].reverse).take(5).map(row =>
              toComment(row)
            ).toList,
            stats = UserProfileStats(
              favoriteCount = favorites.count(_.userId == user.id),
              ratingCount = ratings.count(_.playerId == user.id)
            )
          )
          Right(GetUserProfileResponse(profile))
      }
  }

  val designerLevelService: DesignerLevelService = new DesignerLevelService {
    override def createLevel(request: CreateLevelRequest): Either[HttpError, CreateLevelResponse] =
      if (request.title.trim.isEmpty) {
        Left(DesignerLevelService.CreateLevelValidation(List("title")).toHttpError)
      } else {
        val timestamp = "2026-05-26T12:00:00Z"
        val row = LevelRow(
          id = s"level-${levels.size + 1}",
          title = request.title.trim,
          description = request.description,
          tags = request.tags,
          data = request.data,
          authorId = request.designerId,
          status = LevelStatus.Draft,
          rejectionReason = None,
          averageRating = 0,
          ratingCount = 0,
          createdAt = timestamp,
          updatedAt = timestamp,
          publishedAt = None
        )
        levels = levels :+ row
        Right(CreateLevelResponse(toLevel(row)))
      }

    override def submitLevel(request: SubmitLevelRequest): Either[HttpError, SubmitLevelResponse] =
      levels.indexWhere(_.id == request.levelId) match {
        case -1 =>
          Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: ${request.levelId}"))
        case levelIndex =>
          val level = levels(levelIndex)
          if (level.authorId != request.designerId) {
            Left(HttpError.forbidden("Cannot submit another designer's level"))
          } else if (submissions.exists(submission => submission.levelId == request.levelId && submission.status == SubmissionStatus.PendingReview)) {
            Left(HttpError.conflict("SUBMISSION_EXISTS", "Level already has a pending submission"))
          } else if (level.status != LevelStatus.Draft && level.status != LevelStatus.Rejected) {
            Left(HttpError.conflict("INVALID_LEVEL_STATUS", "Level cannot be submitted in current status"))
          } else {
            val timestamp = "2026-05-26T12:30:00Z"
            val updatedLevel = level.copy(status = LevelStatus.PendingReview, rejectionReason = None, updatedAt = timestamp)
            levels = levels.updated(levelIndex, updatedLevel)

            val row = SubmissionRow(
              id = s"submission-${submissions.size + 1}",
              levelId = request.levelId,
              submitterId = request.designerId,
              status = SubmissionStatus.PendingReview,
              reviewerId = None,
              reviewNote = None,
              submittedAt = timestamp,
              reviewedAt = None
            )
            submissions = submissions :+ row
            Right(SubmitLevelResponse(toSubmission(row)))
          }
      }
  }

  val playerRatingService: PlayerRatingService = new PlayerRatingService {
    private def publishedLevel(levelId: String): Either[HttpError, LevelRow] =
      levels.find(_.id == levelId) match {
        case Some(level) if level.status == LevelStatus.Published => Right(level)
        case Some(_) => Left(HttpError.notFound("LEVEL_NOT_FOUND", "Published level not found"))
        case None => Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
      }

    override def getPublishedLevels(request: GetPublishedLevelsRequest): Either[HttpError, List[Level]] = {
      val filtered = levels.filter(level =>
        level.status == LevelStatus.Published && request.tag.forall(tag => level.tags.contains(tag))
      )
      val sorted = request.sort match {
        case "highestRated" =>
          filtered.sortBy(level => (-level.averageRating, -level.ratingCount, level.createdAt))
        case "mostRated" =>
          filtered.sortBy(level => (-level.ratingCount, -level.averageRating, level.createdAt))
        case _ =>
          filtered.sortBy(_.createdAt)(Ordering[String].reverse)
      }
      Right(sorted.map(toLevel).toList)
    }

    override def getPublishedLevel(request: GetPublishedLevelRequest): Either[HttpError, Level] =
      publishedLevel(request.levelId).map(toLevel)

    override def getLevelComments(request: GetLevelCommentsRequest): Either[HttpError, List[LevelComment]] =
      publishedLevel(request.levelId).map(_ =>
        comments
          .filter(_.levelId == request.levelId)
          .sortBy(_.createdAt)(Ordering[String].reverse)
          .map(toComment)
          .toList
      )

    override def createComment(request: CreateCommentRequest): Either[HttpError, LevelComment] =
      publishedLevel(request.levelId).map { _ =>
        val timestamp = "2026-05-26T13:30:00Z"
        val row = CommentRow(
          id = s"comment-${comments.size + 1}",
          levelId = request.levelId,
          userId = request.playerId,
          content = request.content.trim,
          createdAt = timestamp
        )
        comments = comments :+ row
        toComment(row)
      }

    override def getFavoriteLevels(request: GetFavoriteLevelsRequest): Either[HttpError, List[FavoriteWithLevel]] =
      Right(
        favorites
          .filter(_.userId == request.playerId)
          .sortBy(_.createdAt)(Ordering[String].reverse)
          .flatMap(favorite => levels.find(level => level.id == favorite.levelId && level.status == LevelStatus.Published).map(level =>
            FavoriteWithLevel.from(favorite, toLevel(level))
          ))
          .toList
      )

    override def favoriteLevel(request: FavoriteLevelRequest): Either[HttpError, Favorite] =
      publishedLevel(request.levelId).map { _ =>
        favorites.find(favorite => favorite.userId == request.playerId && favorite.levelId == request.levelId) match {
          case Some(existing) => existing
          case None =>
            val favorite = Favorite(
              id = s"favorite-${favorites.size + 1}",
              levelId = request.levelId,
              userId = request.playerId,
              createdAt = "2026-05-26T13:40:00Z"
            )
            favorites = favorites :+ favorite
            favorite
        }
      }

    override def unfavoriteLevel(request: FavoriteLevelRequest): Either[HttpError, Favorite] =
      publishedLevel(request.levelId).flatMap { _ =>
        favorites.indexWhere(favorite => favorite.userId == request.playerId && favorite.levelId == request.levelId) match {
          case -1 =>
            Left(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
          case index =>
            val deleted = favorites(index)
            favorites = favorites.patch(index, Nil, 1)
            Right(deleted)
        }
      }

    override def rateLevel(request: RateLevelRequest): Either[HttpError, RateLevelResponse] =
      levels.indexWhere(_.id == request.levelId) match {
        case -1 =>
          Left(PlayerRatingService.LevelMissing(request.levelId).toHttpError)
        case levelIndex =>
          val level = levels(levelIndex)
          if (level.status != LevelStatus.Published) {
            Left(PlayerRatingService.LevelNotPublished(request.levelId).toHttpError)
          } else if (request.score < 1 || request.score > 5) {
            Left(PlayerRatingService.InvalidScore(request.score).toHttpError)
          } else {
            val timestamp = "2026-05-26T13:00:00Z"
            val existingIndex = ratings.indexWhere(rating =>
              rating.levelId == request.levelId && rating.playerId == request.playerId
            )

            val ratingRow =
              if (existingIndex >= 0) {
                val updated = ratings(existingIndex).copy(score = request.score, updatedAt = timestamp)
                ratings = ratings.updated(existingIndex, updated)
                updated
              } else {
                val created = RatingRow(
                  id = s"rating-${ratings.size + 1}",
                  levelId = request.levelId,
                  playerId = request.playerId,
                  score = request.score,
                  createdAt = timestamp,
                  updatedAt = timestamp
                )
                ratings = ratings :+ created
                created
              }

            val levelRatings = ratings.filter(_.levelId == request.levelId)
            val average = if (levelRatings.isEmpty) 0.0 else BigDecimal(levelRatings.map(_.score).sum.toDouble / levelRatings.size).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble
            val updatedLevel = level.copy(
              averageRating = average,
              ratingCount = levelRatings.size,
              updatedAt = timestamp
            )
            levels = levels.updated(levelIndex, updatedLevel)

            Right(RateLevelResponse(toRating(ratingRow)))
          }
      }
  }

  val adminReviewService: AdminReviewService = new AdminReviewService {
    override def getAdminComments(reviewerId: String): Either[HttpError, List[LevelComment]] =
      Right(comments.sortBy(_.createdAt)(Ordering[String].reverse).map(toComment).toList)

    override def deleteComment(reviewerId: String, commentId: String): Either[HttpError, LevelComment] =
      comments.indexWhere(_.id == commentId) match {
        case -1 =>
          Left(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
        case index =>
          val deleted = comments(index)
          comments = comments.patch(index, Nil, 1)
          Right(toComment(deleted))
      }

    override def getPendingSubmissions(reviewerId: String): Either[HttpError, List[SubmissionWithLevel]] =
      Right(
        submissions
          .filter(_.status == SubmissionStatus.PendingReview)
          .flatMap(submission => levels.find(_.id == submission.levelId).map(level =>
            SubmissionWithLevel.from(toSubmission(submission), toLevel(level))
          ))
          .toList
      )

    override def reviewSubmission(request: ReviewSubmissionRequest): Either[HttpError, ReviewSubmissionResponse] =
      submissions.indexWhere(_.id == request.submissionId) match {
        case -1 =>
          Left(AdminReviewService.SubmissionMissing(request.submissionId).toHttpError)
        case submissionIndex =>
          val submission = submissions(submissionIndex)
          if (submission.status != SubmissionStatus.PendingReview) {
            Left(AdminReviewService.SubmissionAlreadyReviewed(request.submissionId).toHttpError)
          } else {
            val timestamp = "2026-05-26T14:00:00Z"
            val reviewed = submission.copy(
              status = request.status,
              reviewerId = Some(request.reviewerId),
              reviewNote = request.reviewNote,
              reviewedAt = Some(timestamp)
            )
            submissions = submissions.updated(submissionIndex, reviewed)

            levels.indexWhere(_.id == submission.levelId) match {
              case -1 =>
                Left(AdminReviewService.LinkedLevelMissing(submission.levelId).toHttpError)
              case levelIndex =>
                val level = levels(levelIndex)
                val updatedLevel =
                  if (request.status == SubmissionStatus.Approved) {
                    level.copy(status = LevelStatus.Published, publishedAt = Some(timestamp), updatedAt = timestamp, rejectionReason = None)
                  } else {
                    level.copy(status = LevelStatus.Rejected, updatedAt = timestamp, rejectionReason = request.reviewNote)
                  }
                levels = levels.updated(levelIndex, updatedLevel)
                Right(ReviewSubmissionResponse(ReviewedSubmission.fromSubmission(toSubmission(reviewed))))
            }
          }
      }
  }

  def apiRoutes: HttpRoutes[cats.effect.IO] =
    ApiRouter.routes(
      authService = authService,
      userService = userService,
      designerLevelService = designerLevelService,
      playerRatingService = playerRatingService,
      adminReviewService = adminReviewService
    )
}
