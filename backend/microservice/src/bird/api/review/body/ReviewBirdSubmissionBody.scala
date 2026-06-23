package microservice.bird.api.review.body

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 鸟类设计投稿审核请求体。
  *
  * @param status 审核结果，仅允许 Approved 或 Rejected
  * @param reviewNote 拒绝时可填原因；通过时可为空
  */
final case class ReviewBirdSubmissionBody(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

/** ReviewBirdSubmissionBody 的 Circe/http4s 编解码 companion。 */
object ReviewBirdSubmissionBody {
  implicit val encoder: Encoder[ReviewBirdSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[ReviewBirdSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewBirdSubmissionBody] = jsonOf
}
