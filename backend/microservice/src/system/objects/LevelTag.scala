package microservice.system.objects

import io.circe.{Decoder, Encoder}

/** 关卡展示标签，用于列表筛选与元数据展示。
  *
  * 与前端 LevelTagSchema 对齐；LevelRow.tags 为 List[LevelTag]。
  */
sealed trait LevelTag {
  def value: String
}

object LevelTag {
  case object Puzzle extends LevelTag { override val value: String = "puzzle" }       // 解谜向
  case object Hard extends LevelTag { override val value: String = "hard" }           // 高难度
  case object Beginner extends LevelTag { override val value: String = "beginner" }   // 新手友好
  case object Funny extends LevelTag { override val value: String = "funny" }         // 趣味/搞怪
  case object Strategy extends LevelTag { override val value: String = "strategy" }   // 策略向

  private val byValue = List(Puzzle, Hard, Beginner, Funny, Strategy).map(tag => tag.value -> tag).toMap

  def fromString(value: String): Option[LevelTag] =
    byValue.get(value)

  implicit val encoder: Encoder[LevelTag] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelTag] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level tag: $value"))
}
