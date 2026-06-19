/** InMemoryStore 上的 关卡评论 CRUD；演示模式与单元测试使用。
  *
  * 关联：关卡模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.level.tables.comment.inmemory

/** CommentTableInMemory 表访问门面。
  *
  * 表职责：封装 commentinmemory 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.CommentRow

import microservice.level.tables.comment._

import microservice.infrastructure.database.InMemoryStore

private[tables] object CommentTableInMemory {
  def listAllForAdmin(): Vector[CommentRow] =
    InMemoryStore.comments.sortBy(_.createdAt)(Ordering[String].reverse)

  def listRecentByUser(userId: String, limit: Int): Vector[CommentRow] =
    InMemoryStore.comments
      .filter(_.userId == userId)
      .sortBy(_.createdAt)(Ordering[String].reverse)
      .take(limit)

  def listByLevel(levelId: String): Vector[CommentRow] =
    InMemoryStore.comments
      .filter(_.levelId == levelId)
      .sortBy(_.createdAt)(Ordering[String].reverse)

  def nextId(): String =
    s"comment-${InMemoryStore.comments.size + 1}"

  def insert(row: CommentRow): CommentRow = {
    InMemoryStore.comments = InMemoryStore.comments :+ row
    row
  }

  def deleteById(commentId: String): Option[CommentRow] =
    InMemoryStore.comments.indexWhere(_.id == commentId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.comments(index)
        InMemoryStore.comments = InMemoryStore.comments.patch(index, Nil, 1)
        Some(deleted)
    }
}
