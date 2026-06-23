package microservice.level.tables.favorite

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.level.objects.social.Favorite
import microservice.level.tables.favorite.jdbc.FavoriteTableJdbc
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.LevelStatus

/** 关卡收藏表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。 */
object FavoriteTable {
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) FavoriteTableJdbc.initialize(connection)

  def countByUser(connection: Connection, userId: String): Int =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites.count(_.userId == userId)
    } else {
      FavoriteTableJdbc.countByUser(connection, userId)
    }

  def listPublishedByUser(connection: Connection, userId: String): Vector[(Favorite, LevelRow)] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites
        .filter(_.userId == userId)
        .sortBy(_.createdAt)(Ordering[String].reverse)
        .flatMap { row =>
          InMemoryStore.levels
            .find(level => level.id == row.levelId && level.status == LevelStatus.Published)
            .map(level => FavoriteRowMapper.toFavorite(row) -> level)
        }
    } else {
      FavoriteTableJdbc.listPublishedByUser(connection, userId)
    }

  def find(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites
        .find(row => row.userId == userId && row.levelId == levelId)
        .map(FavoriteRowMapper.toFavorite)
    } else {
      FavoriteTableJdbc.find(connection, userId, levelId)
    }

  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"favorite-${InMemoryStore.favorites.size + 1}"
    } else {
      FavoriteTableJdbc.nextId(connection)
    }

  def insert(connection: Connection, favorite: Favorite): Favorite =
    if (TableConnection.isInMemory(connection)) {
      val row = FavoriteRowMapper.fromFavorite(favorite)
      InMemoryStore.favorites = InMemoryStore.favorites :+ row
      favorite
    } else {
      FavoriteTableJdbc.insert(connection, favorite)
    }

  def delete(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites.indexWhere(row => row.userId == userId && row.levelId == levelId) match {
        case -1 => None
        case index =>
          val deleted = InMemoryStore.favorites(index)
          InMemoryStore.favorites = InMemoryStore.favorites.patch(index, Nil, 1)
          Some(FavoriteRowMapper.toFavorite(deleted))
      }
    } else {
      FavoriteTableJdbc.delete(connection, userId, levelId)
    }
}
