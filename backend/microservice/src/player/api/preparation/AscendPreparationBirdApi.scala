package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationService

/** POST /player/preparation/birds/:birdType/ascend — 消耗碎片提升鸟阶位。 */
final case class AscendPreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerPreparationService.ascendBird(connection, userId, birdType).map(PlayerPreparationService.toJson))
}
