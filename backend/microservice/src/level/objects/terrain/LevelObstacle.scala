package microservice.level.objects.terrain

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

/** LevelObstacle 伴生对象：Circe JSON 编解码，关卡障碍物实体。 */
private[level] object LevelObstacle {
  implicit val encoder: Encoder[LevelObstacle] = deriveEncoder
  implicit val decoder: Decoder[LevelObstacle] = deriveDecoder
}
