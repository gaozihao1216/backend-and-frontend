package microservice.level.tables.level

import microservice.level.tables.shared.LevelRow

import io.circe.parser.decode
import io.circe.syntax._
import microservice.level.objects.LevelData
import microservice.system.objects.{LevelStatus, LevelTag}
import java.sql.{PreparedStatement, ResultSet, SQLException, Types}

private[tables] object LevelTableCodec {
  val baseSelect: String =
    """
      SELECT id, title, description, tags, data, author_id, status, rejection_reason,
             average_rating, rating_count, created_at, updated_at, published_at
      FROM levels
    """

  def tagsToDb(tags: List[LevelTag]): String =
    tags.map(_.value).mkString(",")

  def levelDataToDb(data: LevelData): String =
    data.asJson.noSpaces

  def setNullableString(statement: PreparedStatement, index: Int, value: Option[String]): Unit =
    value match {
      case Some(text) => statement.setString(index, text)
      case None => statement.setNull(index, Types.VARCHAR)
    }

  def rowFromResultSet(resultSet: ResultSet): LevelRow =
    LevelRow(
      id = resultSet.getString("id"),
      title = resultSet.getString("title"),
      description = resultSet.getString("description"),
      tags = tagsFromDb(resultSet.getString("tags")),
      data = levelDataFromDb(resultSet.getString("data")),
      authorId = resultSet.getString("author_id"),
      status = LevelStatus.fromString(resultSet.getString("status")).getOrElse(
        throw new SQLException(s"Unknown level status: ${resultSet.getString("status")}")
      ),
      rejectionReason = nullableString(resultSet, "rejection_reason"),
      averageRating = resultSet.getDouble("average_rating"),
      ratingCount = resultSet.getInt("rating_count"),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at"),
      publishedAt = nullableString(resultSet, "published_at")
    )

  private def tagsFromDb(value: String): List[LevelTag] =
    if (value.trim.isEmpty) {
      List.empty
    } else {
      value
        .split(",")
        .toList
        .map(_.trim)
        .filter(_.nonEmpty)
        .map(tagValue =>
          LevelTag.fromString(tagValue).getOrElse(
            throw new SQLException(s"Unknown level tag: $tagValue")
          )
        )
    }

  private def levelDataFromDb(value: String): LevelData =
    decode[LevelData](value).fold(
      error => throw new SQLException(s"Invalid level data JSON: ${error.getMessage}", error),
      levelData => levelData
    )

  private def nullableString(resultSet: ResultSet, column: String): Option[String] =
    Option(resultSet.getString(column))
}
