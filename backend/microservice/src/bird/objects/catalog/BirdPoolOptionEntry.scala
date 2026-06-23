package microservice.bird.objects.catalog

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 总监 bird pool 下拉选项（bird 模块导出给 admin 等调用方）。 */
final case class BirdPoolOptionEntry(
  birdType: String,
  name: String,
  source: String,
  authorId: Option[String] = None
)

private[bird] object BirdPoolOptionEntry {
  implicit val encoder: Encoder[BirdPoolOptionEntry] = deriveEncoder
  implicit val decoder: Decoder[BirdPoolOptionEntry] = deriveDecoder
}
