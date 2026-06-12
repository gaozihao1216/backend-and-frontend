package microservice.ui.api.pagecomponents

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.PageComponent
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/pages/:pageId/components/:componentId 的请求体。 */
final case class UpdatePageComponentBody(
  component: PageComponent
)

object UpdatePageComponentBody {
  implicit val encoder: Encoder[UpdatePageComponentBody] = deriveEncoder
  implicit val decoder: Decoder[UpdatePageComponentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdatePageComponentBody] = jsonOf
}
