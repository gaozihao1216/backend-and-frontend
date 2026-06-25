package microservice.ui.objects.page.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.page.PageConfig
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/pages 的请求对象；含完整 PageConfig。
  *
  * 定义：JSON body 反序列化为该 case class。
  * 关联：page 字段对齐 objects.PageConfig；前端 CreateUiPageApi / UpdateUiPageApi 对应 schema。
  */
final case class CreateUiPageRequest(
  page: PageConfig
)

/** CreateUiPageRequest 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object CreateUiPageRequest {
  implicit val encoder: Encoder[CreateUiPageRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateUiPageRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateUiPageRequest] = jsonOf
}
