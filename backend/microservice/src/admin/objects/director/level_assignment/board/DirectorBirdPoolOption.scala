package microservice.admin.objects.director.level_assignment.board

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 总监配置 bird pool 时的可选鸟条目 DTO（系统内置或设计师发布）。 */
final case class DirectorBirdPoolOption(
  birdType: String,
  name: String,
  source: String,
  authorId: Option[String] = None
)

object DirectorBirdPoolOption {
  implicit val encoder: Encoder[DirectorBirdPoolOption] = deriveEncoder
  implicit val decoder: Decoder[DirectorBirdPoolOption] = deriveDecoder
}
