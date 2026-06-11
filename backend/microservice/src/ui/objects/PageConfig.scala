package microservice.ui.objects

/** 动态页面完整配置：id、路由 path、角色端点、布局与组件列表。
  *
  * 前后端契约对象；存储于 UiPageTable，由 DynamicPageRenderer 消费。
  */
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class PageConfig(
  id: String,
  name: String,
  path: String,
  roleScope: UiEndpoint,
  layout: PageLayout,
  components: List[PageComponent]
)

object PageConfig {
  implicit val encoder: Encoder[PageConfig] = deriveEncoder
  implicit val decoder: Decoder[PageConfig] = deriveDecoder
}
