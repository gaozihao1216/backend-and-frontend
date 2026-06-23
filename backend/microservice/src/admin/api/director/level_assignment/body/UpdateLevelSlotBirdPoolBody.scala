package microservice.admin.api.director.level_assignment.body

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.inventory.BirdPool
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT level-assignments/:levelSuffix/bird-pool 请求体；birdPool 覆盖槽位现有配置。 */
final case class UpdateLevelSlotBirdPoolBody(
  birdPool: BirdPool
)

object UpdateLevelSlotBirdPoolBody {
  implicit val encoder: Encoder[UpdateLevelSlotBirdPoolBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateLevelSlotBirdPoolBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateLevelSlotBirdPoolBody] = jsonOf
}
