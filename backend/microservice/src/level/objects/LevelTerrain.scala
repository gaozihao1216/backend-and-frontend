package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class TerrainVoidSpan(id: String, startX: Double, endX: Double)

object TerrainVoidSpan {
  implicit val encoder: Encoder[TerrainVoidSpan] = deriveEncoder
  implicit val decoder: Decoder[TerrainVoidSpan] = deriveDecoder
}

final case class LevelTerrain(
  ceilingBoundary: Option[LevelGround],
  groundBoundary: LevelGround,
  voidSpans: List[TerrainVoidSpan]
)

object LevelTerrain {
  implicit val encoder: Encoder[LevelTerrain] = deriveEncoder
  implicit val decoder: Decoder[LevelTerrain] = deriveDecoder
}
