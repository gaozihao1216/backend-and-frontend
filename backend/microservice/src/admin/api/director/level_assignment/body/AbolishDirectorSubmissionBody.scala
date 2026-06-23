package microservice.admin.api.director.level_assignment.body

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST submissions/:submissionId/abolish 请求体；note 写入 reviewNote 与 Level.rejectionReason。 */
final case class AbolishDirectorSubmissionBody(
  note: Option[String]
)

object AbolishDirectorSubmissionBody {
  implicit val encoder: Encoder[AbolishDirectorSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[AbolishDirectorSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AbolishDirectorSubmissionBody] = jsonOf
}
