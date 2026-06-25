package microservice.ui.objects.page

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.endpoint.UiEndpoint
import microservice.ui.objects.component.PageComponent

/** 动态页面完整配置领域对象。 */
final case class PageConfig(
  id: String,
  name: String,
  path: String,
  roleScope: UiEndpoint,
  layout: PageLayout,
  components: List[PageComponent]
)

/** PageConfig 的 Circe 编解码。 */
private[ui] object PageConfig {
  implicit val encoder: Encoder[PageConfig] = deriveEncoder
  implicit val decoder: Decoder[PageConfig] = deriveDecoder
}
