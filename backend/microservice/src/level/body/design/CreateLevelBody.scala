package microservice.level.body.design

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.core.LevelData
import microservice.system.objects.LevelTag
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /designer/levels 的请求体：关卡元数据与编辑器 JSON。 */
final case class CreateLevelBody(
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData
)

object CreateLevelBody {
  implicit val encoder: Encoder[CreateLevelBody] = deriveEncoder
  implicit val decoder: Decoder[CreateLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateLevelBody] = jsonOf
}
