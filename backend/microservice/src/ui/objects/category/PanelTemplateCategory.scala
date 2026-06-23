package microservice.ui.objects.category

/** 面板拉伸模板 category 合法值与默认值。 */
private[ui] object PanelTemplateCategory {
  val SmallPanel: String = "smallPanel"
  val LevelBackground: String = "levelBackground"

  val values: Set[String] = Set(SmallPanel, LevelBackground)
  val defaultValue: String = SmallPanel

  def isValid(value: String): Boolean = values.contains(value)
}
