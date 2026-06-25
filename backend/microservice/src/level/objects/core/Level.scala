package microservice.level.objects.core

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.enums.{LevelStatus, LevelTag}

/** 关卡领域对象，API 对外返回的核心 DTO。
  *
  * 字段说明：
  *   - id / title / description / tags：关卡标识与元数据
  *   - data：编辑器 JSON（GameWorld、地形、障碍物等）
  *   - authorId：设计师用户 ID
  *   - status / rejectionReason：审核生命周期状态
  *   - averageRating / ratingCount：玩家评分聚合
  *   - createdAt / updatedAt / publishedAt：时间戳
  */
final case class Level(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

/** Level 伴生对象：Circe JSON 编解码，供关卡 API 响应与编辑器数据交换。 */
private[level] object Level {
  implicit val encoder: Encoder[Level] = deriveEncoder
  implicit val decoder: Decoder[Level] = deriveDecoder
}
