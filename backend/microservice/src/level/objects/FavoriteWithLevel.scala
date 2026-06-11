package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** 收藏记录与关卡详情的组合 DTO，供 GET /player/favorites 返回。
  *
  * 字段说明：
  *   - id / levelId / userId / createdAt：Favorite 字段
  *   - level：嵌套的完整 Level 对象
  */
final case class FavoriteWithLevel(
  id: String,
  levelId: String,
  userId: String,
  createdAt: String,
  level: Level
)

object FavoriteWithLevel {
  def from(favorite: Favorite, level: Level): FavoriteWithLevel =
    FavoriteWithLevel(favorite.id, favorite.levelId, favorite.userId, favorite.createdAt, level)

  implicit val encoder: Encoder[FavoriteWithLevel] = deriveEncoder
  implicit val decoder: Decoder[FavoriteWithLevel] = deriveDecoder
}
