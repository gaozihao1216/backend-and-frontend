package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 关卡地形边界配置：天花板、地面与虚空区间。
  *
  * 字段说明：
  *   - ceilingBoundary：天花板边界（可选）
  *   - groundBoundary：地面边界（必填）
  *   - voidSpans：地图中的虚空/掉落区间列表
  */
final case class LevelTerrain(
  ceilingBoundary: Option[LevelGround],
  groundBoundary: LevelGround,
  voidSpans: List[TerrainVoidSpan]
)

object LevelTerrain {
  implicit val encoder: Encoder[LevelTerrain] = deriveEncoder
  implicit val decoder: Decoder[LevelTerrain] = deriveDecoder
}
