package microservice.admin.objects.director.level_assignment.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST submissions/:submissionId/abolish 请求对象；note 写入 reviewNote 与 Level.rejectionReason。 */
final case class AbolishDirectorSubmissionRequest(
  note: Option[String]
)

private[admin] object AbolishDirectorSubmissionRequest {
  implicit val encoder: Encoder[AbolishDirectorSubmissionRequest] = deriveEncoder
  implicit val decoder: Decoder[AbolishDirectorSubmissionRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AbolishDirectorSubmissionRequest] = jsonOf
}
