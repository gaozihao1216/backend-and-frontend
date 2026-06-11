package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationService

/** GET /player/preparation — 获取当前用户全部鸟与弹弓备战状态。 */
final case class GetPreparationStateAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerPreparationService.getState(connection, userId).map(PlayerPreparationService.toJson))
}
