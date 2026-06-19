package microservice.ui.tables.ui_page_rollback

import io.circe.parser.decode
import io.circe.syntax._
import microservice.ui.objects.PageConfig

import java.sql.{PreparedStatement, ResultSet}

private[tables] object UiPageRollbackTableCodec {
  val baseSelect: String =
    """
      SELECT page_id, page_json, created_at
      FROM ui_page_rollbacks
    """

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

  def bindRow(statement: PreparedStatement, row: UiPageRollbackRow): Unit = {
    statement.setString(1, row.pageId)
    statement.setString(2, row.page.asJson.noSpaces)
    statement.setString(3, row.createdAt)
  }
}
