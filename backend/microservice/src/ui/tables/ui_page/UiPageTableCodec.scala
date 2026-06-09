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

  def layoutToDb(layout: PageLayout): String =
    layout.asJson.noSpaces

  def componentsToDb(components: List[PageComponent]): String =
    components.asJson.noSpaces

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
