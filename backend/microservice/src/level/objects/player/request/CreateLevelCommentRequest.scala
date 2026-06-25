package microservice.level.objects.player.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 玩家创建关卡评论的请求对象。
  *
  * @param content 评论正文；由 CreateCommentAPIMessage 校验非空
  */
final case class CreateLevelCommentRequest(
  content: String
)

/** CreateLevelCommentRequest 的 Circe/http4s 编解码 companion。 */
private[level] object CreateLevelCommentRequest {
  implicit val encoder: Encoder[CreateLevelCommentRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateLevelCommentRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateLevelCommentRequest] = jsonOf
}
