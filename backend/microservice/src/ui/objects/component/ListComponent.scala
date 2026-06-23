package microservice.ui.objects.component

/** 列表组件：dataPath 驱动，含 itemTemplate 子组件树。 */
final case class ListComponent(
  id: String,
  dataPath: String,
  itemTemplate: List[PageComponent],
  emptyStateText: Option[String],
  position: ComponentPosition,
  style: Option[ComponentStyle],
  binding: Option[ComponentBinding]
) extends PageComponent {
  override val `type`: String = "list"
}
