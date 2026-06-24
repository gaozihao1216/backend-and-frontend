package microservice.level.body.player

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 玩家创建关卡评论的请求体。
  *
  * @param content 评论正文；由 CreateCommentAPIMessage 校验非空
  */
final case class CreateCommentBody(
  content: String
)

/** CreateCommentBody 的 Circe/http4s 编解码 companion。 */
private[level] object CreateCommentBody {
  implicit val encoder: Encoder[CreateCommentBody] = deriveEncoder
  implicit val decoder: Decoder[CreateCommentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateCommentBody] = jsonOf
}
