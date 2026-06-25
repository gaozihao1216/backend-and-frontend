package microservice.level.tables.shared {

import microservice.level.objects.inventory.{BirdPool}
import microservice.level.objects.core.{LevelData}
import microservice.system.objects.enums.{LevelStatus, LevelTag, SubmissionStatus}
import microservice.level.objects.core.{Level}
import microservice.level.objects.social.{LevelComment, Rating}
import microservice.level.objects.submission.{Submission}

final case class LevelRow(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

final case class RatingRow(
  id: String,
  levelId: String,
  playerId: String,
  score: Int,
  createdAt: String,
  updatedAt: String
)

final case class CommentRow(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

final case class SubmissionRow(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

final case class LevelSlotAssignmentRow(
  id: String,
  levelSuffix: String,
  submissionId: String,
  sourceLevelId: String,
  assignedById: String,
  assignedAt: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)

final case class FavoriteRow(
  id: String,
  levelId: String,
  userId: String,
  createdAt: String
)

/** 持久化 Row 与领域对象之间的映射器。
  *
  * 实现：纯字段拷贝，不含业务逻辑；Table 层返回 Row，API 层通过此对象转为对外 DTO。
  * 关联：所有 level 模块 APIMessage 在返回前均经此转换。
  */
object LevelRowMapper {
  /** LevelRow → Level 领域对象。 */
  def toLevel(row: LevelRow): Level =
    Level(
      row.id,
      row.title,
      row.description,
      row.tags,
      row.data,
      row.authorId,
      row.status,
      row.rejectionReason,
      row.averageRating,
      row.ratingCount,
      row.createdAt,
      row.updatedAt,
      row.publishedAt
    )

  /** RatingRow → Rating 领域对象。 */
  def toRating(row: RatingRow): Rating =
    Rating(row.id, row.levelId, row.playerId, row.score, row.createdAt, row.updatedAt)

  /** CommentRow → LevelComment 领域对象。 */
  def toComment(row: CommentRow): LevelComment =
    LevelComment(row.id, row.levelId, row.userId, row.content, row.createdAt)

  /** SubmissionRow → Submission 领域对象。 */
  def toSubmission(row: SubmissionRow): Submission =
    Submission(
      row.id,
      row.levelId,
      row.submitterId,
      row.status,
      row.reviewerId,
      row.reviewNote,
      row.submittedAt,
      row.reviewedAt
    )
}
}

package microservice.level.tables.level {

import microservice.level.tables.shared.LevelRow
import io.circe.parser.decode
import io.circe.syntax._
import microservice.level.objects.core.LevelData
import microservice.system.objects.enums.{LevelStatus, LevelTag}
import java.sql.{PreparedStatement, ResultSet, SQLException, Types}
import java.sql.Connection

/** LevelTableCodec 表访问门面。
  *
  * 表职责：封装 levelcodec 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * JDBC 表字段编解码：负责 ResultSet 映射与 SQL 参数绑定。
  */


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

/** levels 表的 JDBC 实现：DDL、查询与写入均在此对象内完成，不再经 Write/Insert/Update 中转。 */
object LevelTable {

  def findById(connection: Connection, levelId: String): Option[LevelRow] = {
    val statement = connection.prepareStatement(s"${LevelTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, levelId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(LevelTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS level_count FROM levels")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"level-${resultSet.getInt("level_count") + 1}" else "level-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listPublishedByAuthor(connection: Connection, authorId: String): Vector[LevelRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${LevelTableCodec.baseSelect}
        WHERE author_id = ? AND status = ?
        ORDER BY created_at DESC, id ASC
      """
    )
    try {
      statement.setString(1, authorId)
      statement.setString(2, LevelStatus.Published.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def listPublished(connection: Connection, tag: Option[LevelTag], sort: String): Vector[LevelRow] = {
    val orderBy = sort match {
      case "highestRated" => "average_rating DESC, rating_count DESC, created_at ASC, id ASC"
      case "mostRated" => "rating_count DESC, average_rating DESC, created_at ASC, id ASC"
      case _ => "created_at DESC, id ASC"
    }
    val tagFilter = tag.map(_ => " AND (',' || tags || ',') LIKE ?").getOrElse("")
    val statement = connection.prepareStatement(
      s"""
        ${LevelTableCodec.baseSelect}
        WHERE status = ?$tagFilter
        ORDER BY $orderBy
      """
    )
    try {
      statement.setString(1, LevelStatus.Published.value)
      tag.foreach(value => statement.setString(2, s"%,${value.value},%"))
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def insert(connection: Connection, row: LevelRow): LevelRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO levels (
          id, title, description, tags, data, author_id, status, rejection_reason,
          average_rating, rating_count, created_at, updated_at, published_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.title)
      statement.setString(3, row.description)
      statement.setString(4, LevelTableCodec.tagsToDb(row.tags))
      statement.setString(5, LevelTableCodec.levelDataToDb(row.data))
      statement.setString(6, row.authorId)
      statement.setString(7, row.status.value)
      LevelTableCodec.setNullableString(statement, 8, row.rejectionReason)
      statement.setDouble(9, row.averageRating)
      statement.setInt(10, row.ratingCount)
      statement.setString(11, row.createdAt)
      statement.setString(12, row.updatedAt)
      LevelTableCodec.setNullableString(statement, 13, row.publishedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def updateSubmissionStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET status = ?, rejection_reason = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setString(1, status.value)
      LevelTableCodec.setNullableString(statement, 2, rejectionReason)
      statement.setString(3, updatedAt)
      statement.setString(4, levelId)
      statement
    }

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET status = ?, rejection_reason = ?, published_at = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setString(1, status.value)
      LevelTableCodec.setNullableString(statement, 2, rejectionReason)
      LevelTableCodec.setNullableString(statement, 3, publishedAt)
      statement.setString(4, updatedAt)
      statement.setString(5, levelId)
      statement
    }

  def updateRatingStats(
    connection: Connection,
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET average_rating = ?, rating_count = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setDouble(1, averageRating)
      statement.setInt(2, ratingCount)
      statement.setString(3, updatedAt)
      statement.setString(4, levelId)
      statement
    }

  private def updateAndRead(
    connection: Connection,
    levelId: String
  )(statementFactory: => java.sql.PreparedStatement): Option[LevelRow] = {
    val statement = statementFactory
    try {
      if (statement.executeUpdate() == 0) None else findById(connection, levelId)
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[LevelRow] =
    try {
      val builder = Vector.newBuilder[LevelRow]
      while (resultSet.next()) {
        builder += LevelTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }
}
}
