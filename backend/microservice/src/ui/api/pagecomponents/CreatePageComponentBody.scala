package microservice.ui.api.pagecomponents

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.PageComponent
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/pages/:pageId/components 的请求体。 */
final case class CreatePageComponentBody(
  component: PageComponent
)

object CreatePageComponentBody {
  implicit val encoder: Encoder[CreatePageComponentBody] = deriveEncoder
  implicit val decoder: Decoder[CreatePageComponentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreatePageComponentBody] = jsonOf
}
