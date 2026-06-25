package microservice.system.objects.enums

import io.circe.{Decoder, Encoder}

/** 关卡生命周期状态枚举。
  *
  * 定义：sealed trait + 四个 case object，value 为 JSON/DB 字符串。
  * 问题：设计师草稿、待审、已发布、已驳回需在同一字段上区分且类型安全。
  * 作用：驱动 LevelRow.status 流转；玩家 API 过滤 Published；审核 API 处理 PendingReview。
  * 关联：[[LevelRow]]、CreateLevel/SubmitLevel/ReviewSubmission APIMessage；前端 level schema。
  */
sealed trait LevelStatus {
  def value: String
}

/** LevelStatus 伴生对象：枚举常量、字符串解析（fromString）与 Circe 编解码。 */
object LevelStatus {
  case object Draft extends LevelStatus { override val value: String = "draft" }                   // 设计师草稿，未提交
  case object PendingReview extends LevelStatus { override val value: String = "pending_review" } // 已提交，待管理员审核
  case object Published extends LevelStatus { override val value: String = "published" }           // 审核通过，玩家可见
  case object Rejected extends LevelStatus { override val value: String = "rejected" }             // 审核驳回

  private val byValue = List(Draft, PendingReview, Published, Rejected).map(status => status.value -> status).toMap

  /** 按持久化/JSON 字符串反查枚举；未知值返回 None。 */
  def fromString(value: String): Option[LevelStatus] =
    byValue.get(value)

  implicit val encoder: Encoder[LevelStatus] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelStatus] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level status: $value"))
}
