package microservice.admin.objects.submission.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.enums.SubmissionStatus
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 关卡投稿审核请求对象：携带审核决策与可选备注。
  *
  * @param status 审核结果，仅允许 Approved 或 Rejected；由 ReviewSubmissionAPIMessage 校验
  * @param reviewNote 拒绝时可填原因；通过时可为空
  */
final case class ReviewSubmissionRequest(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

/** ReviewSubmissionRequest 的 Circe/http4s 编解码 companion。 */
private[admin] object ReviewSubmissionRequest {
  implicit val encoder: Encoder[ReviewSubmissionRequest] = deriveEncoder
  implicit val decoder: Decoder[ReviewSubmissionRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewSubmissionRequest] = jsonOf
}
