package microservice.ui.api.pages.body

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.page.PageConfig
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** PUT /admin/director/ui/pages/:pageId 与 publish 的请求体。
  *
  * 定义：JSON body 含待写入的 PageConfig。
  * 关联：objects.PageConfig；UpdateUiPageApi 与 PublishUiPageApi 共用此 body。
  */
final case class UpdateUiPageBody(
  page: PageConfig
)

/** UpdateUiPageBody 的 Circe 编解码与 http4s EntityDecoder。 */
object UpdateUiPageBody {
  implicit val encoder: Encoder[UpdateUiPageBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateUiPageBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateUiPageBody] = jsonOf
}
