package microservice.ui.objects.stretch_template.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST panel-templates 或 pattern-templates 的请求对象。
  *
  * 定义：JSON body 含 StretchVisualTemplate（kind 由路由覆盖）。
  * 关联：objects.StretchVisualTemplate；CreateStretchVisualTemplateApi。
  */
final case class CreateStretchVisualTemplateRequest(
  template: StretchVisualTemplate
)

/** CreateStretchVisualTemplateRequest 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object CreateStretchVisualTemplateRequest {
  implicit val encoder: Encoder[CreateStretchVisualTemplateRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateStretchVisualTemplateRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateStretchVisualTemplateRequest] = jsonOf
}
