/** InMemoryStore 上的 评分 CRUD；演示模式与单元测试使用。
  *
  * 关联：关卡模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.level.tables.rating.inmemory

/** RatingTableInMemory 表访问门面。
  *
  * 表职责：封装 ratinginmemory 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.RatingRow

import microservice.level.tables.rating._

import microservice.infrastructure.database.InMemoryStore

private[tables] object RatingTableInMemory {
  def countByPlayer(playerId: String): Int =
    InMemoryStore.ratings.count(_.playerId == playerId)

  def findByLevelAndPlayer(levelId: String, playerId: String): Option[RatingRow] =
    InMemoryStore.ratings.find(rating => rating.levelId == levelId && rating.playerId == playerId)

  def listByLevel(levelId: String): Vector[RatingRow] =
    InMemoryStore.ratings.filter(_.levelId == levelId)

  def nextId(): String =
    s"rating-${InMemoryStore.ratings.size + 1}"

  def insert(row: RatingRow): RatingRow = {
    InMemoryStore.ratings = InMemoryStore.ratings :+ row
    row
  }

  def updateScore(ratingId: String, score: Int, updatedAt: String): Option[RatingRow] =
    InMemoryStore.ratings.indexWhere(_.id == ratingId) match {
      case -1 => None
      case index =>
        val updated = InMemoryStore.ratings(index).copy(score = score, updatedAt = updatedAt)
        InMemoryStore.ratings = InMemoryStore.ratings.updated(index, updated)
        Some(updated)
    }
}
