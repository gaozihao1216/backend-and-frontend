package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 关卡内静态障碍物（物理体）。
  *
  * 字段说明：
  *   - id / material：标识与材质类型
  *   - position / size / angle：位置、尺寸与旋转角度（angle 可选）
  */
final case class LevelObstacle(
  id: String,
  material: String,
  position: Position,
  size: Size,
  angle: Option[Double]
)

object LevelObstacle {
  implicit val encoder: Encoder[LevelObstacle] = deriveEncoder
  implicit val decoder: Decoder[LevelObstacle] = deriveDecoder
}
