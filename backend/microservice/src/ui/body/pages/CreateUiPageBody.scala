package microservice.ui.body.pages

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.ui.objects.page.PageConfig
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /admin/director/ui/pages 的请求体；含完整 PageConfig。
  *
  * 定义：JSON body 反序列化为该 case class。
  * 关联：page 字段对齐 objects.PageConfig；前端 CreateUiPageApi / UpdateUiPageApi 对应 schema。
  */
final case class CreateUiPageBody(
  page: PageConfig
)

/** CreateUiPageBody 的 Circe 编解码与 http4s EntityDecoder。 */
private[ui] object CreateUiPageBody {
  implicit val encoder: Encoder[CreateUiPageBody] = deriveEncoder
  implicit val decoder: Decoder[CreateUiPageBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateUiPageBody] = jsonOf
}
