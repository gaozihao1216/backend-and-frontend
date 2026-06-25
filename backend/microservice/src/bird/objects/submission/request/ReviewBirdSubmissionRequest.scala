package microservice.bird.objects.submission.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.enums.SubmissionStatus
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 鸟类设计投稿审核请求对象。
  *
  * @param status 审核结果，仅允许 Approved 或 Rejected
  * @param reviewNote 拒绝时可填原因；通过时可为空
  */
final case class ReviewBirdSubmissionRequest(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

/** ReviewBirdSubmissionRequest 的 Circe/http4s 编解码 companion。 */
private[bird] object ReviewBirdSubmissionRequest {
  implicit val encoder: Encoder[ReviewBirdSubmissionRequest] = deriveEncoder
  implicit val decoder: Decoder[ReviewBirdSubmissionRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewBirdSubmissionRequest] = jsonOf
}
