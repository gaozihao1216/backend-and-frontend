package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanStep, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.level.api.internal.user.GetUserLevelProfileDataInternalAPIMessage
import microservice.user.objects.profile.{GetUserProfileErrors, UserProfile, UserProfileStats}
import microservice.user.support.AccessControl
import microservice.user.support.UserProfileMapping
import microservice.user.tables.user.{UserRowMapper, UserTable}

/** GET /users/:profileUserId/profile 的 APIMessage。 */
final case class GetUserProfileAPIMessage(
  viewerUserId: String,
  profileUserId: String
) extends APIWithTokenMessage[UserProfile] {
  override def token: String = viewerUserId

  /** plan 定义了什么业务流程：已登录用户查看指定用户的公开资料页。
    *
    * 关联的前端 API：GET /users/:profileUserId/profile；前端 `GetUserProfileApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, UserProfile]] =
    PlanSteps.finish {
      for {
        // 步骤 1：确认 viewer 为已知用户
        _ <- AccessControl.requireKnownUser(connection, viewerUserId).map(_ => ())
        // 步骤 2：校验目标用户存在
        user <- UserTable.findById(connection, profileUserId) match {
          case None      => PlanStep.fail(GetUserProfileErrors.UserMissing(profileUserId).toHttpError)
          case Some(row) => PlanStep.succeed(row)
        }
        // 步骤 3：聚合查询目标用户的关卡与互动数据
        levelData <- PlanSteps.runApi(GetUserLevelProfileDataInternalAPIMessage(profileUserId), connection)
      } yield profileFromData(user, levelData)
    }

  private def profileFromData(
    user: microservice.user.tables.user.UserRow,
    levelData: microservice.level.objects.user.UserLevelProfileData
  ): UserProfile =
    UserProfile(
      user = UserRowMapper.toBackendUser(user),
      publishedLevels = levelData.publishedLevels.map(UserProfileMapping.toPublishedLevel),
      recentComments = levelData.recentComments.map(UserProfileMapping.toComment),
      stats = UserProfileStats(
        favoriteCount = levelData.favoriteCount,
        ratingCount = levelData.ratingCount
      )
    )
}
