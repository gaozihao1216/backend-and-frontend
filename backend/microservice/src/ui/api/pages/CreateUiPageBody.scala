package microservice.ui.api.pages

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.PageConfig
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/pages 的请求体。 */
final case class CreateUiPageBody(
  page: PageConfig
)

object CreateUiPageBody {
  implicit val encoder: Encoder[CreateUiPageBody] = deriveEncoder
  implicit val decoder: Decoder[CreateUiPageBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateUiPageBody] = jsonOf
}
