package microservice.admin.api.director.level_assignment.body

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.inventory.BirdPool
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST level-assignments/:levelSuffix 请求体；字段语义见 [[microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment]]。 */
final case class AssignLevelSlotBody(
  submissionId: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)

object AssignLevelSlotBody {
  implicit val encoder: Encoder[AssignLevelSlotBody] = deriveEncoder
  implicit val decoder: Decoder[AssignLevelSlotBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AssignLevelSlotBody] = jsonOf
}
