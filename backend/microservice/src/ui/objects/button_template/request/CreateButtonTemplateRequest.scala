package microservice.ui.objects.button_template.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.button_template.ButtonTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/button-templates 的请求对象。
  *
  * 定义：JSON body 含完整 ButtonTemplate。
  * 关联：objects.ButtonTemplate；前端 CreateButtonTemplateApi 对应 schema。
  */
final case class CreateButtonTemplateRequest(
  template: ButtonTemplate
)

/** CreateButtonTemplateRequest 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object CreateButtonTemplateRequest {
  implicit val encoder: Encoder[CreateButtonTemplateRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateButtonTemplateRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateButtonTemplateRequest] = jsonOf
}
