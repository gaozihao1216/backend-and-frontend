package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.PlayerUiRuntimeSupport
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** GET /player/ui/data/:apiKey 动态 UI 数据 APIMessage。 */
final case class GetPlayerUiDataAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player).map(_ => ())
        payload <- PlayerUiRuntimeSupport.requireData(connection, userId, apiKey, params)
      } yield payload
    }
}
