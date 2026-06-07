package microservice.ui.tables

import io.circe.parser.decode
import io.circe.syntax._
import java.sql.{PreparedStatement, ResultSet, SQLException}
import microservice.ui.objects.{ButtonTemplateCategory, ButtonTemplateScalingMode, ButtonTemplateSlice}

private[tables] object ButtonTemplateTableCodec {
  val baseSelect: String =
    """
      SELECT id, name, source_data_url, category, scaling_mode, slice, created_at, updated_at
      FROM ui_button_templates
    """

  def sliceToDb(slice: ButtonTemplateSlice): String =
    slice.asJson.noSpaces

  def bindRow(statement: PreparedStatement, row: ButtonTemplateRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.name)
    statement.setString(3, row.sourceDataUrl)
    statement.setString(4, row.category)
    statement.setString(5, row.scalingMode.value)
    statement.setString(6, sliceToDb(row.slice))
    statement.setString(7, row.createdAt)
    statement.setString(8, row.updatedAt)
  }

  def rowFromResultSet(resultSet: ResultSet): ButtonTemplateRow =
    ButtonTemplateRow(
      id = resultSet.getString("id"),
      name = resultSet.getString("name"),
      sourceDataUrl = resultSet.getString("source_data_url"),
      category = Option(resultSet.getString("category")).filter(_.nonEmpty).getOrElse(ButtonTemplateCategory.defaultValue),
      scalingMode = ButtonTemplateScalingMode.fromString(resultSet.getString("scaling_mode")).getOrElse(ButtonTemplateScalingMode.FixedAspect),
      slice = sliceFromDb(resultSet.getString("slice")),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )

  private def sliceFromDb(value: String): ButtonTemplateSlice =
    decode[ButtonTemplateSlice](value).fold(
      error => throw new SQLException(s"Invalid UI button template slice JSON: ${error.getMessage}", error),
      identity
    )
}
