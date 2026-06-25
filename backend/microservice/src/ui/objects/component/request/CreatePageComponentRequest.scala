package microservice.ui.objects.component.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.component.PageComponent
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/pages/:pageId/components 的请求对象。
  *
  * 定义：JSON body 含单个 PageComponent（button/panel/text/list）。
  * 关联：objects.PageComponent ADT；CreatePageComponentApi。
  */
final case class CreatePageComponentRequest(
  component: PageComponent
)

/** CreatePageComponentRequest 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object CreatePageComponentRequest {
  implicit val encoder: Encoder[CreatePageComponentRequest] = deriveEncoder
  implicit val decoder: Decoder[CreatePageComponentRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreatePageComponentRequest] = jsonOf
}
