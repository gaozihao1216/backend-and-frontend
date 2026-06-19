package microservice.system.objects

import io.circe.{Decoder, Encoder}

/** 关卡提交流水状态枚举。
  *
  * 定义：sealed trait + PendingReview/Approved/Rejected/Abolished 四态。
  * 问题：单次 submit 产生独立流水，需与 Level.status 解耦以保留审核历史。
  * 作用：SubmissionRow.status 记录每条提交流转；abolished 表示撤回或总监废止。
  * 关联：[[SubmissionRow]]、SubmitLevel/ReviewSubmission APIMessage；与 [[LevelStatus]] 协同。
  */
sealed trait SubmissionStatus {
  def value: String
}

object SubmissionStatus {
  case object PendingReview extends SubmissionStatus { override val value: String = "pending_review" } // 待审
  case object Approved extends SubmissionStatus { override val value: String = "approved" }               // 已通过
  case object Rejected extends SubmissionStatus { override val value: String = "rejected" }             // 已驳回
  case object Abolished extends SubmissionStatus { override val value: String = "abolished" }           // 已废止/撤回

  private val byValue =
    List(PendingReview, Approved, Rejected, Abolished).map(status => status.value -> status).toMap

  def fromString(value: String): Option[SubmissionStatus] =
    byValue.get(value)

  implicit val encoder: Encoder[SubmissionStatus] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[SubmissionStatus] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown submission status: $value"))
}
