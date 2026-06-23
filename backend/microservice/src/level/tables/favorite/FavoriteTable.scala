package microservice.level.tables.favorite

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.level.objects.social.Favorite
import microservice.level.tables.favorite.jdbc.FavoriteTableJdbc
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.LevelStatus

/** 关卡收藏表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：TableConnection.isInMemory(connection) 为 true 时直接读写 InMemoryStore；否则走 FavoriteTableJdbc。
  * 关联：FavoriteLevel/UnfavoriteLevel/GetFavoriteLevels APIMessage。
  */
object FavoriteTable {
  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) FavoriteTableJdbc.initialize(connection)

  /** 统计指定用户的收藏总数。 */
  def countByUser(connection: Connection, userId: String): Int =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites.count(_.userId == userId)
    } else {
      FavoriteTableJdbc.countByUser(connection, userId)
    }

  /** 列出用户收藏的全部已发布关卡（Favorite + LevelRow 元组）。 */
  def listPublishedByUser(connection: Connection, userId: String): Vector[(Favorite, LevelRow)] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites
        .filter(_.userId == userId)
        .sortBy(_.createdAt)(Ordering[String].reverse)
        .flatMap(favorite =>
          InMemoryStore.levels
            .find(level => level.id == favorite.levelId && level.status == LevelStatus.Published)
            .map(level => favorite -> level)
        )
    } else {
      FavoriteTableJdbc.listPublishedByUser(connection, userId)
    }

  /** 查找用户对指定关卡的收藏记录。 */
  def find(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites.find(favorite => favorite.userId == userId && favorite.levelId == levelId)
    } else {
      FavoriteTableJdbc.find(connection, userId, levelId)
    }

  /** 生成下一个收藏 ID。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"favorite-${InMemoryStore.favorites.size + 1}"
    } else {
      FavoriteTableJdbc.nextId(connection)
    }

  /** 插入新收藏记录。 */
  def insert(connection: Connection, favorite: Favorite): Favorite =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites = InMemoryStore.favorites :+ favorite
      favorite
    } else {
      FavoriteTableJdbc.insert(connection, favorite)
    }

  /** 删除收藏记录；返回被删除的 Favorite（若存在）。 */
  def delete(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.favorites.indexWhere(favorite => favorite.userId == userId && favorite.levelId == levelId) match {
        case -1 => None
        case index =>
          val deleted = InMemoryStore.favorites(index)
          InMemoryStore.favorites = InMemoryStore.favorites.patch(index, Nil, 1)
          Some(deleted)
      }
    } else {
      FavoriteTableJdbc.delete(connection, userId, levelId)
    }
}
