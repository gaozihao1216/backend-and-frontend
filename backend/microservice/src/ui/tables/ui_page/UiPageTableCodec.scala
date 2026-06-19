/** JDBC 读路径专用：SQL 列名 ↔ UI 页面 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.ui.tables.ui_page

import io.circe.parser.decode
import io.circe.syntax._
import java.sql.{PreparedStatement, ResultSet, SQLException}
import microservice.ui.objects.{PageComponent, PageLayout, UiEndpoint}

private[tables] object UiPageTableCodec {
  val baseSelect: String =
    """
      SELECT id, name, path, role_scope, layout, components, created_at, updated_at
      FROM ui_pages
    """

  /** PageLayout 序列化为 JSON 字符串写入 layout 列。 */
  def layoutToDb(layout: PageLayout): String =
    layout.asJson.noSpaces

  /** PageComponent 列表序列化为 JSON 字符串写入 components 列。 */
  def componentsToDb(components: List[PageComponent]): String =
    components.asJson.noSpaces

  /** 将 UiPageRow 绑定到 INSERT/UPDATE PreparedStatement 占位符。 */
  def bindRow(statement: PreparedStatement, row: UiPageRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.name)
    statement.setString(3, row.path)
    statement.setString(4, row.roleScope.value)
    statement.setString(5, layoutToDb(row.layout))
    statement.setString(6, componentsToDb(row.components))
    statement.setString(7, row.createdAt)
    statement.setString(8, row.updatedAt)
  }

  /** 从 ResultSet 解析单行 UiPageRow（含 JSON 反序列化 layout/components）。 */
  def rowFromResultSet(resultSet: ResultSet): UiPageRow =
    UiPageRow(
      id = resultSet.getString("id"),
      name = resultSet.getString("name"),
      path = resultSet.getString("path"),
      roleScope = UiEndpoint.fromString(resultSet.getString("role_scope")).getOrElse(
        throw new SQLException(s"Unknown UI endpoint: ${resultSet.getString("role_scope")}")
      ),
      layout = layoutFromDb(resultSet.getString("layout")),
      components = componentsFromDb(resultSet.getString("components")),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )

  private def layoutFromDb(value: String): PageLayout =
    decode[PageLayout](value).fold(
      error => throw new SQLException(s"Invalid UI page layout JSON: ${error.getMessage}", error),
      identity
    )

  private def componentsFromDb(value: String): List[PageComponent] =
    decode[List[PageComponent]](value).fold(
      error => throw new SQLException(s"Invalid UI page components JSON: ${error.getMessage}", error),
      identity
    )
}
