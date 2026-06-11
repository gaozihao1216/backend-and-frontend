/** 关卡表的 JDBC 插入专用路径。
  *
  * 实现：与 JdbcWrite 互补，负责新建行的 INSERT 逻辑。
  */
package microservice.level.tables.level.jdbc

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.level._

import java.sql.Connection

private[tables] object LevelTableJdbcInsert {
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
}
