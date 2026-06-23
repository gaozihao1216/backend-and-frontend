/** JDBC 读路径专用：SQL 列名 ↔ 鸟类设计 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.bird.tables.design

import microservice.bird.tables.shared.BirdDesignRow

import microservice.system.objects.LevelStatus

private[tables] object BirdDesignTableCodec {
  val baseSelect: String =
    """
      SELECT id, author_id, name, summary, skill_name, attack, impact, speed,
             tier_skills_json, preview_image_url, mechanism_tags_json, status,
             rejection_reason, created_at, updated_at, published_at
      FROM bird_designs
    """

  def rowFromResultSet(resultSet: java.sql.ResultSet): BirdDesignRow =
    BirdDesignRow(
      id = resultSet.getString("id"),
      authorId = resultSet.getString("author_id"),
      name = resultSet.getString("name"),
      summary = resultSet.getString("summary"),
      skillName = resultSet.getString("skill_name"),
      attack = resultSet.getInt("attack"),
      impact = resultSet.getInt("impact"),
      speed = resultSet.getInt("speed"),
      tierSkillsJson = resultSet.getString("tier_skills_json"),
      previewImageUrl = resultSet.getString("preview_image_url"),
      mechanismTagsJson = resultSet.getString("mechanism_tags_json"),
      status = LevelStatus.fromString(resultSet.getString("status")).getOrElse(LevelStatus.Draft),
      rejectionReason = Option(resultSet.getString("rejection_reason")),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at"),
      publishedAt = Option(resultSet.getString("published_at"))
    )

  def bindRow(statement: java.sql.PreparedStatement, row: BirdDesignRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.authorId)
    statement.setString(3, row.name)
    statement.setString(4, row.summary)
    statement.setString(5, row.skillName)
    statement.setInt(6, row.attack)
    statement.setInt(7, row.impact)
    statement.setInt(8, row.speed)
    statement.setString(9, row.tierSkillsJson)
    statement.setString(10, row.previewImageUrl)
    statement.setString(11, row.mechanismTagsJson)
    statement.setString(12, row.status.value)
    row.rejectionReason match {
      case Some(reason) => statement.setString(13, reason)
      case None => statement.setNull(13, java.sql.Types.VARCHAR)
    }
    statement.setString(14, row.createdAt)
    statement.setString(15, row.updatedAt)
    row.publishedAt match {
      case Some(value) => statement.setString(16, value)
      case None => statement.setNull(16, java.sql.Types.VARCHAR)
    }
  }
}
