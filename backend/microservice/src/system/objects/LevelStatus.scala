package microservice.system.objects

import io.circe.{Decoder, Encoder}

/** 关卡生命周期状态，描述设计师草稿到发布/驳回的流转。
  *
  * 关联：LevelRow.status、玩家列表仅暴露 Published；管理员可见 PendingReview。
  */
sealed trait LevelStatus {
  def value: String
}

object LevelStatus {
  case object Draft extends LevelStatus { override val value: String = "draft" }                   // 设计师草稿，未提交
  case object PendingReview extends LevelStatus { override val value: String = "pending_review" } // 已提交，待管理员审核
  case object Published extends LevelStatus { override val value: String = "published" }           // 审核通过，玩家可见
  case object Rejected extends LevelStatus { override val value: String = "rejected" }             // 审核驳回

  private val byValue = List(Draft, PendingReview, Published, Rejected).map(status => status.value -> status).toMap

  def fromString(value: String): Option[LevelStatus] =
    byValue.get(value)

  implicit val encoder: Encoder[LevelStatus] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelStatus] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level status: $value"))
}
