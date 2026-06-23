package microservice.user.support

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.user.objects.{GetUserProfileErrors, UserProfile}
import microservice.user.tables.UserProfileTable

/** 用户资料只读聚合查询校验。 */
object UserProfileAccess {
  def requireProfile(connection: Connection, profileUserId: String): Step[UserProfile] =
    PlanStep.fromEither(checkProfile(connection, profileUserId))

  def checkProfile(connection: Connection, profileUserId: String): Either[HttpError, UserProfile] =
    UserProfileTable
      .findProfile(connection, profileUserId)
      .toRight(GetUserProfileErrors.UserMissing(profileUserId).toHttpError)
}
