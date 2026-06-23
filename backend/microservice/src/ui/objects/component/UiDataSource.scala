package microservice.ui.objects.component

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 组件动态数据源配置（apiKey、刷新模式等）。 */
final case class UiDataSource(
  `type`: String,
  apiKey: Option[String],
  params: Option[Map[String, String]],
  refreshMode: Option[String]
)

/** UiDataSource 编解码。 */
private[ui] object UiDataSource {
  implicit val encoder: Encoder[UiDataSource] = deriveEncoder
  implicit val decoder: Decoder[UiDataSource] = deriveDecoder
}
