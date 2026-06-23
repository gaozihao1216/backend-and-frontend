package microservice.level.tables.favorite

import microservice.level.objects.social.Favorite
import microservice.level.tables.shared.FavoriteRow

object FavoriteRowMapper {
  def toFavorite(row: FavoriteRow): Favorite =
    Favorite(
      id = row.id,
      levelId = row.levelId,
      userId = row.userId,
      createdAt = row.createdAt
    )

  def fromFavorite(favorite: Favorite): FavoriteRow =
    FavoriteRow(
      id = favorite.id,
      levelId = favorite.levelId,
      userId = favorite.userId,
      createdAt = favorite.createdAt
    )
}
