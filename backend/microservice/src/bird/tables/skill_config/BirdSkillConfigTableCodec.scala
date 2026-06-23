/** JDBC 读路径专用：SQL 列名 ↔ 鸟技能配置 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.bird.tables.skill_config

private[tables] object BirdSkillConfigTableCodec {
  val baseSelect: String =
    """
      SELECT bird_type, skills_json, model_image_url, updated_by_id, updated_at
      FROM bird_skill_configs
    """

  def rowFromResultSet(resultSet: java.sql.ResultSet): BirdSkillConfigRow =
    BirdSkillConfigRow(
      birdType = resultSet.getString("bird_type"),
      skillsJson = resultSet.getString("skills_json"),
      modelImageUrl = Option(resultSet.getString("model_image_url")),
      updatedById = Option(resultSet.getString("updated_by_id")),
      updatedAt = resultSet.getString("updated_at")
    )

  def bindRow(statement: java.sql.PreparedStatement, row: BirdSkillConfigRow): Unit = {
    statement.setString(1, row.birdType)
    statement.setString(2, row.skillsJson)
    statement.setString(3, row.modelImageUrl.orNull)
    statement.setString(4, row.updatedById.orNull)
    statement.setString(5, row.updatedAt)
  }
}
