package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 关卡内敌人实体。
  *
  * 字段说明：
  *   - id / type：标识与敌人类型
  *   - position：位置
  *   - size：碰撞体尺寸（可选，部分敌人类型无固定尺寸）
  */
final case class LevelEnemy(
  id: String,
  `type`: String,
  position: Position,
  size: Option[Size]
)

object LevelEnemy {
  implicit val encoder: Encoder[LevelEnemy] = deriveEncoder
  implicit val decoder: Decoder[LevelEnemy] = deriveDecoder
}
