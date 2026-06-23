package microservice.level.tables.comment

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.level.tables.comment.jdbc.CommentTableJdbc
import microservice.level.tables.shared.CommentRow

/** 关卡评论表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：TableConnection.isInMemory(connection) 为 true 时直接读写 InMemoryStore；否则走 CommentTableJdbc。
  * 关联：CreateComment/GetLevelComments APIMessage；admin GetAdminComments/DeleteComment。
  */
object CommentTable {
  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) CommentTableJdbc.initialize(connection)

  /** 列出全部评论（管理员后台用）。 */
  def listAllForAdmin(connection: Connection): Vector[CommentRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.comments.sortBy(_.createdAt)(Ordering[String].reverse)
    } else {
      CommentTableJdbc.listAllForAdmin(connection)
    }

  /** 列出指定用户最近的评论（限制条数）。 */
  def listRecentByUser(connection: Connection, userId: String, limit: Int): Vector[CommentRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.comments
        .filter(_.userId == userId)
        .sortBy(_.createdAt)(Ordering[String].reverse)
        .take(limit)
    } else {
      CommentTableJdbc.listRecentByUser(connection, userId, limit)
    }

  /** 列出指定关卡的全部评论。 */
  def listByLevel(connection: Connection, levelId: String): Vector[CommentRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.comments
        .filter(_.levelId == levelId)
        .sortBy(_.createdAt)(Ordering[String].reverse)
    } else {
      CommentTableJdbc.listByLevel(connection, levelId)
    }

  /** 生成下一个评论 ID。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"comment-${InMemoryStore.comments.size + 1}"
    } else {
      CommentTableJdbc.nextId(connection)
    }

  /** 插入新评论记录。 */
  def insert(connection: Connection, row: CommentRow): CommentRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.comments = InMemoryStore.comments :+ row
      row
    } else {
      CommentTableJdbc.insert(connection, row)
    }

  /** 按 ID 删除评论；返回被删除的记录（若存在）。 */
  def deleteById(connection: Connection, commentId: String): Option[CommentRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.comments.indexWhere(_.id == commentId) match {
        case -1 => None
        case index =>
          val deleted = InMemoryStore.comments(index)
          InMemoryStore.comments = InMemoryStore.comments.patch(index, Nil, 1)
          Some(deleted)
      }
    } else {
      CommentTableJdbc.deleteById(connection, commentId)
    }
}
