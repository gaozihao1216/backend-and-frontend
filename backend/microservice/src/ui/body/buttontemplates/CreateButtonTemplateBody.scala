package microservice.ui.body.buttontemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.button_template.ButtonTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/button-templates 的请求体。
  *
  * 定义：JSON body 含完整 ButtonTemplate。
  * 关联：objects.ButtonTemplate；前端 CreateButtonTemplateApi 对应 schema。
  */
final case class CreateButtonTemplateBody(
  template: ButtonTemplate
)

/** CreateButtonTemplateBody 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object CreateButtonTemplateBody {
  implicit val encoder: Encoder[CreateButtonTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[CreateButtonTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateButtonTemplateBody] = jsonOf
}
