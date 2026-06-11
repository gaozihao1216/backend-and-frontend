/** 鸟技能配置表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：鸟设计模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.bird.tables.skill_config.jdbc

import microservice.bird.tables.skill_config._

import java.sql.Connection

private[tables] object BirdSkillConfigTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS bird_skill_configs (
            bird_type TEXT PRIMARY KEY,
            skills_json TEXT NOT NULL,
            model_image_url TEXT,
            updated_by_id TEXT REFERENCES users(id),
            updated_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
