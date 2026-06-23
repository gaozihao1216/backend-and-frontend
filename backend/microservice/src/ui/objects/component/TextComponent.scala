package microservice.ui.objects.component

/** 文本组件：静态或绑定文本内容。 */
final case class TextComponent(
  id: String,
  text: String,
  position: ComponentPosition,
  style: Option[ComponentStyle],
  binding: Option[ComponentBinding]
) extends PageComponent {
  override val `type`: String = "text"
}
