package microservice.ui.objects.category

/** 按钮模板 category 合法值与默认值。 */
private[ui] object ButtonTemplateCategory {
  val Business: String = "business"
  val Level: String = "level"

  val values: Set[String] = Set(Business, Level)
  val defaultValue: String = Business

  /** 检查 category 字符串是否在合法枚举内。 */
  def isValid(value: String): Boolean = values.contains(value)
}
