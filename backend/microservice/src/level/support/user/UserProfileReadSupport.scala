package microservice.level.support.user

import java.sql.Connection
import microservice.level.objects.user.{ProfileCommentSnapshot, ProfileLevelSnapshot, UserLevelProfileData}
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.rating.RatingTable
import microservice.level.tables.shared.LevelRowMapper

/** 用户资料页 level 侧读聚合（level 模块内）。 */
private[level] object UserProfileReadSupport {
  def loadForUser(connection: Connection, userId: String): UserLevelProfileData =
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
}
