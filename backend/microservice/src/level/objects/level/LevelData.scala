package microservice.level.objects.level

import io.circe.generic.semiauto._
import microservice.level.objects.inventory.{BirdInventory, BirdPool}
import microservice.level.objects.terrain._
import io.circe.{Decoder, Encoder}

/** 关卡编辑器 JSON 根结构，嵌入 Level.data 字段。
  *
  * 字段说明：
  *   - world：物理世界尺寸与重力
  *   - ground / terrain：地面与地形边界（可选，旧格式兼容 ground）
  *   - birdInventory：玩家可用鸟数量
  *   - obstacles / enemies：关卡内障碍物与敌人列表
  *   - backgroundTemplateId：背景模板 ID（可选）
  *   - birdPool：Director 配置的鸟池限制（可选）
  */
final case class LevelData(
  world: GameWorld,
  ground: Option[LevelGround],
  terrain: Option[LevelTerrain],
  birdInventory: BirdInventory,
  obstacles: List[LevelObstacle],
  enemies: List[LevelEnemy],
  backgroundTemplateId: Option[String] = None,
  birdPool: Option[BirdPool] = None
)

object LevelData {
  implicit val encoder: Encoder[LevelData] = deriveEncoder
  implicit val decoder: Decoder[LevelData] = deriveDecoder
}
