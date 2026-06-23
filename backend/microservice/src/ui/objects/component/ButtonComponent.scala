package microservice.ui.objects.component

import io.circe.Json

/** 按钮组件：标签、图标、设计稿与 action。 */
final case class ButtonComponent(
  id: String,
  label: String,
  icon: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  baseDesign: Option[Json],
  imageDesign: Option[Json],
  stateDesign: Option[Json],
  dataSource: Option[UiDataSource],
  binding: Option[ComponentBinding],
  action: ComponentAction
) extends PageComponent {
  override val `type`: String = "button"
}
