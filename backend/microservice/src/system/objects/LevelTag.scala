package microservice.system.objects

import io.circe.{Decoder, Encoder}

/** 关卡展示标签枚举。
  *
  * 定义：Puzzle/Hard/Beginner/Funny/Strategy 五类标签，可多选存于 LevelRow.tags。
  * 问题：玩家浏览关卡需按难度/风格筛选与展示元数据。
  * 作用：设计师创建关卡时选择；列表 API 返回供前端 badge 渲染。
  * 关联：[[LevelRow.tags]]、前端 LevelTagSchema、[[SystemDemoData.demoLevelData]] 样例。
  */
sealed trait LevelTag {
  def value: String
}

/** LevelTag 伴生对象：关卡标签枚举、字符串解析与 Circe 编解码。 */
object LevelTag {
  case object Puzzle extends LevelTag { override val value: String = "puzzle" }       // 解谜向
  case object Hard extends LevelTag { override val value: String = "hard" }           // 高难度
  case object Beginner extends LevelTag { override val value: String = "beginner" }   // 新手友好
  case object Funny extends LevelTag { override val value: String = "funny" }         // 趣味/搞怪
  case object Strategy extends LevelTag { override val value: String = "strategy" }   // 策略向

  private val byValue = List(Puzzle, Hard, Beginner, Funny, Strategy).map(tag => tag.value -> tag).toMap

  /** 按持久化/JSON 字符串反查标签；未知值返回 None。 */
  def fromString(value: String): Option[LevelTag] =
    byValue.get(value)

  implicit val encoder: Encoder[LevelTag] =
    Encoder.encodeString.contramap(_.value)

  implicit val decoder: Decoder[LevelTag] =
    Decoder.decodeString.emap(value => byValue.get(value).toRight(s"Unknown level tag: $value"))
}
