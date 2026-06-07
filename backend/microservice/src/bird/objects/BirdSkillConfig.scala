package microservice.bird.objects

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._

final case class BirdSkillConfig(
  birdType: String,
  skills: Json,
  modelImageUrl: Option[String],
  updatedById: Option[String],
  updatedAt: String
)

object BirdSkillConfig {
  implicit val encoder: Encoder[BirdSkillConfig] = deriveEncoder
  implicit val decoder: Decoder[BirdSkillConfig] = deriveDecoder
}

final case class DirectorBirdSkillEntry(
  birdType: String,
  name: String,
  source: String,
  authorId: Option[String],
  skillName: String,
  tierSkillDescriptions: List[String],
  configured: Boolean,
  skills: Option[Json],
  modelImageUrl: Option[String]
)

object DirectorBirdSkillEntry {
  implicit val encoder: Encoder[DirectorBirdSkillEntry] = deriveEncoder
  implicit val decoder: Decoder[DirectorBirdSkillEntry] = deriveDecoder
}

final case class DirectorBirdSkillBoard(
  birds: List[DirectorBirdSkillEntry]
)

object DirectorBirdSkillBoard {
  implicit val encoder: Encoder[DirectorBirdSkillBoard] = deriveEncoder
  implicit val decoder: Decoder[DirectorBirdSkillBoard] = deriveDecoder
}
