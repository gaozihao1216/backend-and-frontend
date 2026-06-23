package microservice.ui.body.stretchtemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.stretch_template.StretchVisualTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT panel-templates/:id 或 pattern-templates/:id 的请求体。
  *
  * 定义：JSON body 含待更新的 StretchVisualTemplate。
  * 关联：objects.StretchVisualTemplate；UpdateStretchVisualTemplateApi。
  */
final case class UpdateStretchVisualTemplateBody(
  template: StretchVisualTemplate
)

/** UpdateStretchVisualTemplateBody 的 Circe 编解码与 http4s EntityDecoder。 */
object UpdateStretchVisualTemplateBody {
  implicit val encoder: Encoder[UpdateStretchVisualTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateStretchVisualTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateStretchVisualTemplateBody] = jsonOf
}
