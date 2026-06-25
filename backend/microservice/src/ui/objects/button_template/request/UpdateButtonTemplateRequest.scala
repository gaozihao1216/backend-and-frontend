package microservice.ui.objects.button_template.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.button_template.ButtonTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/button-templates/:templateId 的请求对象。
  *
  * 定义：JSON body 含待更新的 ButtonTemplate（id 由路径覆盖）。
  * 关联：objects.ButtonTemplate；前端 UpdateButtonTemplateApi 对应 schema。
  */
final case class UpdateButtonTemplateRequest(
  template: ButtonTemplate
)

/** UpdateButtonTemplateRequest 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object UpdateButtonTemplateRequest {
  implicit val encoder: Encoder[UpdateButtonTemplateRequest] = deriveEncoder
  implicit val decoder: Decoder[UpdateButtonTemplateRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateButtonTemplateRequest] = jsonOf
}
