package microservice.ui.api.buttontemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.ButtonTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/button-templates/:templateId 的请求体。
  *
  * 定义：JSON body 含待更新的 ButtonTemplate（id 由路径覆盖）。
  * 关联：objects.ButtonTemplate；前端 UpdateButtonTemplateApi 对应 schema。
  */
final case class UpdateButtonTemplateBody(
  template: ButtonTemplate
)

/** UpdateButtonTemplateBody 的 Circe 编解码与 http4s EntityDecoder。 */
object UpdateButtonTemplateBody {
  implicit val encoder: Encoder[UpdateButtonTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateButtonTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateButtonTemplateBody] = jsonOf
}
