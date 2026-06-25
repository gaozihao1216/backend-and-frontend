package microservice.admin.objects.director.level_assignment.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.admin.objects.level.AdminBirdPool
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST level-assignments/:levelSuffix 请求对象；字段语义见 [[microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment]]。 */
final case class AssignLevelSlotRequest(
  submissionId: String,
  note: Option[String],
  birdPool: Option[AdminBirdPool] = None
)

private[admin] object AssignLevelSlotRequest {
  implicit val encoder: Encoder[AssignLevelSlotRequest] = deriveEncoder
  implicit val decoder: Decoder[AssignLevelSlotRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AssignLevelSlotRequest] = jsonOf
}
