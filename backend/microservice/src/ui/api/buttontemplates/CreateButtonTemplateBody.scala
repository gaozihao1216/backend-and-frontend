package microservice.ui.api.buttontemplates

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.ButtonTemplate
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/button-templates 的请求体。 */
final case class CreateButtonTemplateBody(
  template: ButtonTemplate
)

object CreateButtonTemplateBody {
  implicit val encoder: Encoder[CreateButtonTemplateBody] = deriveEncoder
  implicit val decoder: Decoder[CreateButtonTemplateBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateButtonTemplateBody] = jsonOf
}
