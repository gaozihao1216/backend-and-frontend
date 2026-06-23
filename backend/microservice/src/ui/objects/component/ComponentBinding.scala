package microservice.ui.objects.component

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 组件数据绑定：文本、可见/禁用条件表达式。 */
final case class ComponentBinding(
  text: Option[String],
  visibleWhen: Option[String],
  disabledWhen: Option[String]
)

/** ComponentBinding 编解码。 */
object ComponentBinding {
  implicit val encoder: Encoder[ComponentBinding] = deriveEncoder
  implicit val decoder: Decoder[ComponentBinding] = deriveDecoder
}
