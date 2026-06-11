package microservice.system.objects

import io.circe.{Decoder, Encoder}

/** 关卡提交流水状态，与 LevelStatus 配合记录审核历史。
  *
  * 实现：每次 submit 产生一条 SubmissionRow；审核通过后可同步 Level 为 Published。
  * abolished 表示设计师主动撤回或管理员废止的历史记录。
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
