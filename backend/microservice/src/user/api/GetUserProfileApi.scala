package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.objects.UserProfile
import microservice.user.support.UserProfileAccess
import microservice.user.utils.AccessControl

/** GET /users/:profileUserId/profile 的 APIMessage。 */
final case class GetUserProfileAPIMessage(
  viewerUserId: String,
  profileUserId: String
) extends APIWithTokenMessage[UserProfile] {
  override def token: String = viewerUserId

  /** plan：校验 viewer 存在 → UserProfileTable.findProfile（只读聚合）。 */
  override def plan(connection: Connection): IO[Either[HttpError, UserProfile]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireKnownUser(connection, viewerUserId).map(_ => ())
        profile <- UserProfileAccess.requireProfile(connection, profileUserId)
      } yield profile
    }
}
