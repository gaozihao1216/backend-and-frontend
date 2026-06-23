package microservice.level.objects.terrain

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 地形中的虚空/掉落区间：玩家或物体落入此 X 范围即视为掉出地图。 */
final case class TerrainVoidSpan(id: String, startX: Double, endX: Double)

/** TerrainVoidSpan 伴生对象：Circe JSON 编解码，地形镂空区间。 */
private[level] object TerrainVoidSpan {
  implicit val encoder: Encoder[TerrainVoidSpan] = deriveEncoder
  implicit val decoder: Decoder[TerrainVoidSpan] = deriveDecoder
}
