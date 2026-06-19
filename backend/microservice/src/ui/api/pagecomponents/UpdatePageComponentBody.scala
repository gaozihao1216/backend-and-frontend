package microservice.ui.api.pagecomponents

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.PageComponent
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/pages/:pageId/components/:componentId 的请求体。
  *
  * 定义：JSON body 含待更新的 PageComponent。
  * 关联：objects.PageComponent ADT；UpdatePageComponentApi。
  */
final case class UpdatePageComponentBody(
  component: PageComponent
)

/** UpdatePageComponentBody 的 Circe 编解码与 http4s EntityDecoder。 */
object UpdatePageComponentBody {
  implicit val encoder: Encoder[UpdatePageComponentBody] = deriveEncoder
  implicit val decoder: Decoder[UpdatePageComponentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdatePageComponentBody] = jsonOf
}
