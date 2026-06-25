package microservice.admin.objects.director.level_assignment.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.admin.objects.level.AdminBirdPool
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT level-assignments/:levelSuffix/bird-pool 请求对象；birdPool 覆盖槽位现有配置。 */
final case class UpdateLevelSlotBirdPoolRequest(
  birdPool: AdminBirdPool
)

private[admin] object UpdateLevelSlotBirdPoolRequest {
  implicit val encoder: Encoder[UpdateLevelSlotBirdPoolRequest] = deriveEncoder
  implicit val decoder: Decoder[UpdateLevelSlotBirdPoolRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateLevelSlotBirdPoolRequest] = jsonOf
}
