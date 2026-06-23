package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.PlayerUiRuntimeSupport
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST /player/ui/actions/:apiKey 动态 UI 动作 APIMessage。 */
final case class InvokePlayerUiActionAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player).map(_ => ())
        payload <- PlayerUiRuntimeSupport.requireAction(connection, userId, apiKey, params)
      } yield payload
    }
}
