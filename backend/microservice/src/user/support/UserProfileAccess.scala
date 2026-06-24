package microservice.user.support

import java.sql.Connection
import microservice.infrastructure.api.{PlanStep, PlanSteps}
import microservice.infrastructure.api.PlanStep.Step
import microservice.level.api.internal.user.GetUserLevelProfileDataInternalAPIMessage
import microservice.user.objects.{GetUserProfileErrors, UserProfile, UserProfileStats}
import microservice.user.tables.user.{UserRowMapper, UserTable}

/** 用户资料只读聚合查询校验。 */
private[user] object UserProfileAccess {
  def requireProfile(connection: Connection, profileUserId: String): Step[UserProfile] =
    for {
      user <- UserTable.findById(connection, profileUserId) match {
        case None =>
          PlanStep.fail(GetUserProfileErrors.UserMissing(profileUserId).toHttpError)
        case Some(row) =>
          PlanStep.succeed(row)
      }
      levelData <- PlanSteps.runApi(GetUserLevelProfileDataInternalAPIMessage(profileUserId), connection)
    } yield UserProfile(
      user = UserRowMapper.toBackendUser(user),
      publishedLevels = levelData.publishedLevels.map(UserProfileMapping.toPublishedLevel),
      recentComments = levelData.recentComments.map(UserProfileMapping.toComment),
      stats = UserProfileStats(
        favoriteCount = levelData.favoriteCount,
        ratingCount = levelData.ratingCount
      )
    )
}
