package microservice.bird.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus

/** 鸟类设计投稿记录：一次 submit 操作产生一条，由 Admin 审核。
  *
  * 关联：BirdSubmissionTable；与 level.objects.Submission 结构类似但关联 birdDesignId。
  */
final case class BirdSubmission(
  id: String,
  birdDesignId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

/** BirdSubmission 伴生对象：Circe JSON 编解码，供鸟类投稿 API 响应。 */
private[bird] object BirdSubmission {
  implicit val encoder: Encoder[BirdSubmission] = deriveEncoder
  implicit val decoder: Decoder[BirdSubmission] = deriveDecoder
}
