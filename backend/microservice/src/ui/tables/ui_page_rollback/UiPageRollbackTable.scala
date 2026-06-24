package microservice.ui.tables.ui_page_rollback

import microservice.ui.objects.page.PageConfig
import io.circe.parser.decode
import io.circe.syntax._
import java.sql.{PreparedStatement, ResultSet}
import java.sql.Connection

/** UI 页面回滚表在存储层的行模型（与 PostgreSQL ui_page_rollbacks 表列一一对应）。
  *
  * 定义：单页上一版已发布配置的快照，pageId 为主键。
  * 作用：PublishUiPage 覆盖前写入，RollbackUiPage 读取并恢复。
  * 关联：经 UiPageRowMapper 间接关联 PageConfig；不直接作为 API 响应。
  */
final case class UiPageRollbackRow(
  /** 被回滚的页面 id，与 ui_pages.id 对应。 */
  pageId: String,
  /** 上一版完整 PageConfig 快照。 */
  page: PageConfig,
  /** 快照写入时间（ISO-8601 字符串）。 */
  createdAt: String
)

/** JDBC 读路径专用：ui_page_rollbacks 表列 ↔ UiPageRollbackRow 编解码。
  *
  * 定义：page_json 列存储完整 PageConfig 的 JSON 序列化。
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL 列对齐。
  * 关联：UiPageRollbackTable。
  */
private[tables] object UiPageRollbackTableCodec {
  /** 回滚表通用 SELECT 列清单。 */
  val baseSelect: String =
    """
      SELECT page_id, page_json, created_at
      FROM ui_page_rollbacks
    """

  /** 从 ResultSet 解析单行并反序列化 page_json 为 PageConfig。 */
  def rowFromResultSet(resultSet: ResultSet): UiPageRollbackRow = {
    val pageJson = resultSet.getString("page_json")
    val page = decode[PageConfig](pageJson).fold(
      error => throw new IllegalStateException(s"Invalid ui_page_rollbacks.page_json: ${error.getMessage}"),
      identity,
    )
    UiPageRollbackRow(
      pageId = resultSet.getString("page_id"),
      page = page,
      createdAt = resultSet.getString("created_at"),
    )
  }

  /** 将 UiPageRollbackRow 绑定到 PreparedStatement 占位符。 */
  def bindRow(statement: PreparedStatement, row: UiPageRollbackRow): Unit = {
    statement.setString(1, row.pageId)
    statement.setString(2, row.page.asJson.noSpaces)
    statement.setString(3, row.createdAt)
  }
}

object UiPageRollbackTable {
/** 创建 ui_page_rollbacks 表（IF NOT EXISTS）。 */

/** 按 pageId 查询单条回滚快照。 */
  def findById(connection: Connection, pageId: String): Option[UiPageRollbackRow] = {
    val statement = connection.prepareStatement(s"${UiPageRollbackTableCodec.baseSelect} WHERE page_id = ?")
    try {
      statement.setString(1, pageId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(UiPageRollbackTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

/** 插入或覆盖该页的回滚快照。 */
  def upsert(connection: Connection, row: UiPageRollbackRow): UiPageRollbackRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ui_page_rollbacks (page_id, page_json, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT (page_id) DO UPDATE SET
          page_json = EXCLUDED.page_json,
          created_at = EXCLUDED.created_at
      """
    )
    try {
      UiPageRollbackTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  /** 按 pageId 删除回滚快照并返回被删行。 */
  def deleteById(connection: Connection, pageId: String): Option[UiPageRollbackRow] =
    UiPageRollbackTable.findById(connection, pageId).flatMap { row =>
      val statement = connection.prepareStatement("DELETE FROM ui_page_rollbacks WHERE page_id = ?")
      try {
        statement.setString(1, pageId)
        if (statement.executeUpdate() > 0) Some(row) else None
      } finally {
        statement.close()
      }
    }
}
