package microservice.ui.objects

/** 按钮、面板、图案三类模板的合法 category 枚举与默认值。 */
/** 按钮模板 category 合法值与默认值。 */
object ButtonTemplateCategory {
  val Business: String = "business"
  val Level: String = "level"

  val values: Set[String] = Set(Business, Level)
  val defaultValue: String = Business

  /** 检查 category 字符串是否在合法枚举内。 */
  /** 检查 category 字符串是否在合法枚举内。 */
  /** 检查 category 字符串是否在合法枚举内。 */
  def isValid(value: String): Boolean = values.contains(value)
}

/** 面板拉伸模板 category 合法值与默认值。 */
object PanelTemplateCategory {
  val SmallPanel: String = "smallPanel"
  val LevelBackground: String = "levelBackground"

  val values: Set[String] = Set(SmallPanel, LevelBackground)
  val defaultValue: String = SmallPanel

  def isValid(value: String): Boolean = values.contains(value)
}

/** 图案拉伸模板 category 合法值与默认值。 */
object PatternTemplateCategory {
  val Diamond: String = "diamond"
  val Coin: String = "coin"
  val Button: String = "button"
  val Level: String = "level"

  val values: Set[String] = Set(Diamond, Coin, Button, Level)
  val defaultValue: String = Button

  def isValid(value: String): Boolean = values.contains(value)
}
