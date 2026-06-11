package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.PlayerUiRuntimeService

/** GET /player/ui/data/:apiKey — 按 apiKey 拉取动态页面运行时数据。 */
final case class GetPlayerUiDataAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerUiRuntimeService.getData(connection, userId, apiKey, params))
}
