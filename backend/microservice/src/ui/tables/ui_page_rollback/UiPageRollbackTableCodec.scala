package microservice.ui.tables.ui_page_rollback

import io.circe.parser.decode
import io.circe.syntax._
import microservice.ui.objects.page.PageConfig

import java.sql.{PreparedStatement, ResultSet}

/** JDBC 读路径专用：ui_page_rollbacks 表列 ↔ UiPageRollbackRow 编解码。
  *
  * 定义：page_json 列存储完整 PageConfig 的 JSON 序列化。
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL 列对齐。
  * 关联：UiPageRollbackTableJdbcRead / UiPageRollbackTableJdbcWrite。
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
