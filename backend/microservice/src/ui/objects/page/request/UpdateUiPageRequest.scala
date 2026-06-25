package microservice.ui.objects.page.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.page.PageConfig
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/pages/:pageId 与 publish 的请求对象。
  *
  * 定义：JSON body 含待写入的 PageConfig。
  * 关联：objects.PageConfig；UpdateUiPageApi 与 PublishUiPageApi 共用此 body。
  */
final case class UpdateUiPageRequest(
  page: PageConfig
)

/** UpdateUiPageRequest 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object UpdateUiPageRequest {
  implicit val encoder: Encoder[UpdateUiPageRequest] = deriveEncoder
  implicit val decoder: Decoder[UpdateUiPageRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateUiPageRequest] = jsonOf
}
