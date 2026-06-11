/** InMemoryStore 上的 关卡 CRUD；演示模式与单元测试使用。
  *
  * 关联：关卡模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.level.tables.level.inmemory

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.level._

import microservice.infrastructure.database.InMemoryStore
import microservice.system.objects.{LevelStatus, LevelTag}

private[tables] object LevelTableInMemory {
  def findById(levelId: String): Option[LevelRow] =
    InMemoryStore.levels.find(_.id == levelId)

  def nextId(): String =
    s"level-${InMemoryStore.levels.size + 1}"

  def listPublishedByAuthor(authorId: String): Vector[LevelRow] =
    InMemoryStore.levels.filter(level => level.authorId == authorId && level.status == LevelStatus.Published)

  def listPublished(tag: Option[LevelTag], sort: String): Vector[LevelRow] = {
    val filtered = InMemoryStore.levels.filter(level =>
      level.status == LevelStatus.Published && tag.forall(level.tags.contains)
    )
    sort match {
      case "highestRated" => filtered.sortBy(level => (-level.averageRating, -level.ratingCount, level.createdAt))
      case "mostRated" => filtered.sortBy(level => (-level.ratingCount, -level.averageRating, level.createdAt))
      case _ => filtered.sortBy(_.createdAt)(Ordering[String].reverse)
    }
  }

  def insert(row: LevelRow): LevelRow = {
    InMemoryStore.levels = InMemoryStore.levels :+ row
    row
  }

  def updateSubmissionStatus(
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateById(levelId)(_.copy(status = status, rejectionReason = rejectionReason, updatedAt = updatedAt))

  def updateReviewStatus(
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateById(levelId)(_.copy(status = status, rejectionReason = rejectionReason, publishedAt = publishedAt, updatedAt = updatedAt))

  def updateRatingStats(
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    updateById(levelId)(_.copy(averageRating = averageRating, ratingCount = ratingCount, updatedAt = updatedAt))

  private def updateById(levelId: String)(update: LevelRow => LevelRow): Option[LevelRow] =
    InMemoryStore.levels.indexWhere(_.id == levelId) match {
      case -1 => None
      case index =>
        val updated = update(InMemoryStore.levels(index))
        InMemoryStore.levels = InMemoryStore.levels.updated(index, updated)
        Some(updated)
    }
}
