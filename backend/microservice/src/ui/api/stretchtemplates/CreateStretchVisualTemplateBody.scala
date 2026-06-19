package microservice.ui.api.stretchtemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.StretchVisualTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST panel-templates 或 pattern-templates 的请求体。
  *
  * 定义：JSON body 含 StretchVisualTemplate（kind 由路由覆盖）。
  * 关联：objects.StretchVisualTemplate；CreateStretchVisualTemplateApi。
  */
final case class CreateStretchVisualTemplateBody(
  template: StretchVisualTemplate
)

/** CreateStretchVisualTemplateBody 的 Circe 编解码与 http4s EntityDecoder。 */
object CreateStretchVisualTemplateBody {
  implicit val encoder: Encoder[CreateStretchVisualTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[CreateStretchVisualTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateStretchVisualTemplateBody] = jsonOf
}
