package microservice.level.tables.comment

import microservice.level.tables.shared.CommentRow

import microservice.level.tables.comment.inmemory._
import microservice.level.tables.comment.jdbc._

import java.sql.Connection

/** 关卡评论表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：isInMemory(connection) 为 true 时走 CommentTableInMemory；否则走 JDBC 读写层。
  * 关联：CreateComment/GetLevelComments APIMessage；admin GetAdminComments/DeleteComment。
  */
object CommentTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) CommentTableJdbcSchema.initialize(connection)

  /** 列出全部评论（管理员后台用）。 */
  def listAllForAdmin(connection: Connection): Vector[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.listAllForAdmin()
    else CommentTableJdbcRead.listAllForAdmin(connection)

  /** 列出指定用户最近的评论（限制条数）。 */
  def listRecentByUser(connection: Connection, userId: String, limit: Int): Vector[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.listRecentByUser(userId, limit)
    else CommentTableJdbcRead.listRecentByUser(connection, userId, limit)

  /** 列出指定关卡的全部评论。 */
  def listByLevel(connection: Connection, levelId: String): Vector[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.listByLevel(levelId)
    else CommentTableJdbcRead.listByLevel(connection, levelId)

  /** 生成下一个评论 ID。 */
  def nextId(connection: Connection): String =
    if (isInMemory(connection)) CommentTableInMemory.nextId()
    else CommentTableJdbcRead.nextId(connection)

  /** 插入新评论记录。 */
  def insert(connection: Connection, row: CommentRow): CommentRow =
    if (isInMemory(connection)) CommentTableInMemory.insert(row)
    else CommentTableJdbcWrite.insert(connection, row)

  /** 按 ID 删除评论；返回被删除的记录（若存在）。 */
  def deleteById(connection: Connection, commentId: String): Option[CommentRow] =
    if (isInMemory(connection)) CommentTableInMemory.deleteById(commentId)
    else CommentTableJdbcWrite.deleteById(connection, commentId)
}
