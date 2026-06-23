package microservice.user.tables

import java.sql.Connection
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.rating.RatingTable
import microservice.level.tables.shared.LevelRowMapper
import microservice.user.objects.{UserProfile, UserProfileStats}
import microservice.user.tables.user.{UserRowMapper, UserTable}

/** 用户资料读聚合门面：跨 User/Level/Comment/Favorite/Rating 表组装 profile。
  *
  * 说明：profile 非独立物理表；本对象封装多表只读查询，供 [[microservice.user.api.GetUserProfileAPIMessage]] 调用。
  * JDBC 模式下各子表各自有 SQL；in-memory 模式下统一读 InMemoryStore。
  */
object UserProfileTable {
  /** 聚合读取完整资料页读模型；用户不存在时返回 None。 */
  def findProfile(connection: Connection, profileUserId: String): Option[UserProfile] =
    UserTable.findById(connection, profileUserId).map { user =>
      UserProfile(
        user = UserRowMapper.toBackendUser(user),
        publishedLevels =
          LevelTable
            .listPublishedByAuthor(connection, user.id)
            .map(LevelRowMapper.toLevel)
            .toList,
        recentComments =
          CommentTable
            .listRecentByUser(connection, user.id, limit = 5)
            .map(LevelRowMapper.toComment)
            .toList,
        stats = UserProfileStats(
          favoriteCount = FavoriteTable.countByUser(connection, user.id),
          ratingCount = RatingTable.countByPlayer(connection, user.id)
        )
      )
    }

  /** 轻量投影：仅 id 列表与计数。 */
  def findProjection(connection: Connection, profileUserId: String): Option[UserProfileProjectionRow] =
    UserTable.findById(connection, profileUserId).map { user =>
      UserProfileProjectionRow(
        userId = user.id,
        publishedLevelIds =
          LevelTable
            .listPublishedByAuthor(connection, user.id)
            .map(_.id)
            .toList,
        recentCommentIds =
          CommentTable
            .listRecentByUser(connection, user.id, limit = 5)
            .map(_.id)
            .toList,
        favoriteCount = FavoriteTable.countByUser(connection, user.id),
        ratingCount = RatingTable.countByPlayer(connection, user.id)
      )
    }
}
