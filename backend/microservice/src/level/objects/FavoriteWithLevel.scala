package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

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
