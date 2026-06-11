package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.{UserRowMapper, UserTable}
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.level.tables.comment.{CommentTable}
import microservice.level.tables.favorite.{FavoriteTable}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.rating.{RatingTable}
import microservice.level.tables.shared.{LevelRowMapper}
import microservice.user.objects.{GetUserProfileErrors, UserProfile, UserProfileStats}

/** GET /users/:profileUserId/profile 的 APIMessage。
  *
  * 读模型聚合：除用户基本信息外，还 join level/comment/favorite/rating 模块数据。
  */
final case class GetUserProfileAPIMessage(
  viewerUserId: String,   // 请求头 x-user-id，当前访问者
  profileUserId: String   // 路径参数，被查看的用户
) extends APIWithTokenMessage[UserProfile] {
  override def token: String = viewerUserId

  override def plan(connection: Connection): IO[Either[HttpError, UserProfile]] =
    IO.pure {
      // --- 1. 校验访问者存在于系统中（演示级：仅要求 x-user-id 合法） ---
      UserTable.findById(connection, viewerUserId) match {
        case None =>
          Left(HttpError.unauthorized("Unknown user"))

        case Some(_) =>
          // --- 2. 加载被查看用户 ---
          UserTable.findById(connection, profileUserId) match {
            case None =>
              Left(GetUserProfileErrors.UserMissing(profileUserId).toHttpError)

            case Some(user) =>
              Right(
                UserProfile(
                  // 用户基本字段 → BackendUser（与 bind 接口返回结构一致）
                  user = UserRowMapper.toBackendUser(user),

                  // 该作者已发布的关卡列表
                  publishedLevels = LevelTable
                    .listPublishedByAuthor(connection, user.id)
                    .map(LevelRowMapper.toLevel)
                    .toList,

                  // 最近 5 条评论（社区/资料页展示）
                  recentComments = CommentTable
                    .listRecentByUser(connection, user.id, limit = 5)
                    .map(LevelRowMapper.toComment)
                    .toList,

                  // 统计摘要：收藏数、评分次数
                  stats = UserProfileStats(
                    favoriteCount = FavoriteTable.countByUser(connection, user.id),
                    ratingCount = RatingTable.countByPlayer(connection, user.id)
                  )
                )
              )
          }
      }
    }
}
