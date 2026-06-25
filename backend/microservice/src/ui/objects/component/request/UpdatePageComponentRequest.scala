package microservice.ui.objects.component.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.component.PageComponent
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/pages/:pageId/components/:componentId 的请求对象。
  *
  * 定义：JSON body 含待更新的 PageComponent。
  * 关联：objects.PageComponent ADT；UpdatePageComponentApi。
  */
final case class UpdatePageComponentRequest(
  component: PageComponent
)

/** UpdatePageComponentRequest 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object UpdatePageComponentRequest {
  implicit val encoder: Encoder[UpdatePageComponentRequest] = deriveEncoder
  implicit val decoder: Decoder[UpdatePageComponentRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdatePageComponentRequest] = jsonOf
}
