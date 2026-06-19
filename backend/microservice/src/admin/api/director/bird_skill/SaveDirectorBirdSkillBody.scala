package microservice.admin.api.director.bird_skill

import cats.effect.IO
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** 保存某鸟种技能配置的请求体。
  *
  * @param skills 技能 JSON，须含非空 stages 数组；由 DirectorBirdSkillSupport.validateSkillsJson 校验
  * @param modelImageUrl 可选 3D/预览模型图 URL；空字符串会被过滤
  */
final case class SaveDirectorBirdSkillBody(
  skills: Json,
  modelImageUrl: Option[String] = None
)

/** SaveDirectorBirdSkillBody 的 Circe/http4s 编解码 companion。 */
object SaveDirectorBirdSkillBody {
  implicit val encoder: Encoder[SaveDirectorBirdSkillBody] = deriveEncoder
  implicit val decoder: Decoder[SaveDirectorBirdSkillBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SaveDirectorBirdSkillBody] = jsonOf
}
