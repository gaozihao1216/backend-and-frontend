package microservice.level.objects.design.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.core.LevelData
import microservice.system.objects.enums.LevelTag
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /designer/levels 的请求对象：关卡元数据与编辑器 JSON。 */
final case class CreateLevelRequest(
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData
)

private[level] object CreateLevelRequest {
  implicit val encoder: Encoder[CreateLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateLevelRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateLevelRequest] = jsonOf
}
