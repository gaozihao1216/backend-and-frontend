package microservice.ui.api.pages

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.PageConfig
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/pages/:pageId 的请求体。 */
final case class UpdateUiPageBody(
  page: PageConfig
)

object UpdateUiPageBody {
  implicit val encoder: Encoder[UpdateUiPageBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateUiPageBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateUiPageBody] = jsonOf
}
