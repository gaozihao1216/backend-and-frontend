package microservice.ui.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class PageConfig(
  id: String,
  name: String,
  path: String,
  roleScope: UiEndpoint,
  layout: PageLayout,
  components: List[PageComponent]
)

object PageConfig {
  implicit val encoder: Encoder[PageConfig] = deriveEncoder
  implicit val decoder: Decoder[PageConfig] = deriveDecoder
}
