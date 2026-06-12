package microservice.ui.api.buttontemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.ButtonTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/button-templates/:templateId 的请求体。 */
final case class UpdateButtonTemplateBody(
  template: ButtonTemplate
)

object UpdateButtonTemplateBody {
  implicit val encoder: Encoder[UpdateButtonTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateButtonTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateButtonTemplateBody] = jsonOf
}
