/** InMemoryStore 上的 收藏 CRUD；演示模式与单元测试使用。
  *
  * 关联：关卡模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.level.tables.favorite.inmemory

/** FavoriteTableInMemory 表访问门面。
  *
  * 表职责：封装 favoriteinmemory 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.LevelRow

import microservice.level.tables.favorite._

import microservice.infrastructure.database.InMemoryStore
import microservice.level.objects.social.Favorite
import microservice.system.objects.LevelStatus

private[tables] object FavoriteTableInMemory {
  def countByUser(userId: String): Int =
    InMemoryStore.favorites.count(_.userId == userId)

  def listPublishedByUser(userId: String): Vector[(Favorite, LevelRow)] =
    InMemoryStore.favorites
      .filter(_.userId == userId)
      .sortBy(_.createdAt)(Ordering[String].reverse)
      .flatMap(favorite =>
        InMemoryStore.levels
          .find(level => level.id == favorite.levelId && level.status == LevelStatus.Published)
          .map(level => favorite -> level)
      )

  def find(userId: String, levelId: String): Option[Favorite] =
    InMemoryStore.favorites.find(favorite => favorite.userId == userId && favorite.levelId == levelId)

  def nextId(): String =
    s"favorite-${InMemoryStore.favorites.size + 1}"

  def insert(favorite: Favorite): Favorite = {
    InMemoryStore.favorites = InMemoryStore.favorites :+ favorite
    favorite
  }

  def delete(userId: String, levelId: String): Option[Favorite] =
    InMemoryStore.favorites.indexWhere(favorite => favorite.userId == userId && favorite.levelId == levelId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.favorites(index)
        InMemoryStore.favorites = InMemoryStore.favorites.patch(index, Nil, 1)
        Some(deleted)
    }
}
