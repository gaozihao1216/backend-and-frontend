package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.PlayerUiRuntimeService

/** POST /player/ui/actions/:apiKey — 执行动态页面交互动作。 */
final case class InvokePlayerUiActionAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerUiRuntimeService.executeAction(connection, userId, apiKey, params))
}
