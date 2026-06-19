package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 地形中的虚空/掉落区间：玩家或物体落入此 X 范围即视为掉出地图。 */
final case class TerrainVoidSpan(id: String, startX: Double, endX: Double)

object TerrainVoidSpan {
  implicit val encoder: Encoder[TerrainVoidSpan] = deriveEncoder
  implicit val decoder: Decoder[TerrainVoidSpan] = deriveDecoder
}
