package microservice.ui.objects.component

import io.circe.Json

/** 面板组件：可含子组件、浮动定位与装饰。 */
final case class PanelComponent(
  id: String,
  kind: Option[String],
  panelRole: Option[String],
  title: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  decoration: Option[Json],
  pathDesign: Option[Json],
  contentSize: Option[PanelContentSize],
  floating: Option[PanelFloating],
  dataSource: Option[UiDataSource],
  binding: Option[ComponentBinding],
  childComponentIds: List[String]
) extends PageComponent {
  override val `type`: String = "panel"
}
