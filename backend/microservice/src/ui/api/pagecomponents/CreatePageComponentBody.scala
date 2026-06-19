package microservice.ui.api.pagecomponents

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.PageComponent
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/pages/:pageId/components 的请求体。
  *
  * 定义：JSON body 含单个 PageComponent（button/panel/text/list）。
  * 关联：objects.PageComponent ADT；CreatePageComponentApi。
  */
final case class CreatePageComponentBody(
  component: PageComponent
)

/** CreatePageComponentBody 的 Circe 编解码与 http4s EntityDecoder。 */
object CreatePageComponentBody {
  implicit val encoder: Encoder[CreatePageComponentBody] = deriveEncoder
  implicit val decoder: Decoder[CreatePageComponentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreatePageComponentBody] = jsonOf
}
