package microservice.level.api.internal.user

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.user.{ProfileCommentSnapshot, ProfileLevelSnapshot, UserLevelProfileData}
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.rating.RatingTable
import microservice.level.tables.shared.LevelRowMapper

/** 模块间 API：加载用户资料页 level 侧数据；由 user HTTP API 调用，不挂路由。 */
final case class GetUserLevelProfileDataInternalAPIMessage(userId: String) extends APIMessage[UserLevelProfileData] {
  override def plan(connection: Connection): IO[Either[HttpError, UserLevelProfileData]] =
    PlanSteps.finish {
      PlanSteps.read(
        UserLevelProfileData(
          publishedLevels =
            LevelTable
              .listPublishedByAuthor(connection, userId)
              .map(row => ProfileLevelSnapshot.from(LevelRowMapper.toLevel(row)))
              .toList,
          recentComments =
            CommentTable
              .listRecentByUser(connection, userId, limit = 5)
              .map(row => ProfileCommentSnapshot.from(LevelRowMapper.toComment(row)))
              .toList,
          favoriteCount = FavoriteTable.countByUser(connection, userId),
          ratingCount = RatingTable.countByPlayer(connection, userId)
        )
      )
    }
}
