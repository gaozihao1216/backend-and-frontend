package microservice.ui.objects.category

/** 图案拉伸模板 category 合法值与默认值。 */
private[ui] object PatternTemplateCategory {
  val Diamond: String = "diamond"
  val Coin: String = "coin"
  val Button: String = "button"
  val Level: String = "level"

  val values: Set[String] = Set(Diamond, Coin, Button, Level)
  val defaultValue: String = Button

  def isValid(value: String): Boolean = values.contains(value)
}
