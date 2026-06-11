package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationService

/** POST /player/preparation/birds/:birdType/upgrade — 消耗金币提升鸟等级。 */
final case class UpgradePreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    IO.pure(PlayerPreparationService.upgradeBird(connection, userId, birdType).map(PlayerPreparationService.toJson))
}
