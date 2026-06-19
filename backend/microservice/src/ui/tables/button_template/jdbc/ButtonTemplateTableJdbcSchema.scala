/** 按钮模板表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：UI 定制模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.ui.tables.button_template.jdbc

import microservice.ui.tables.button_template._

import java.sql.Connection

/** button_templates 表 JDBC DDL 初始化。
  *
  * 关联：ButtonTemplateTable.initialize 在 JDBC 模式下调用。
  */
private[tables] object ButtonTemplateTableJdbcSchema {
  /** 创建 button_templates 表。 */
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_button_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            source_data_url TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'business',
            scaling_mode TEXT NOT NULL DEFAULT 'fixedAspect',
            slice TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        "ALTER TABLE ui_button_templates ADD COLUMN IF NOT EXISTS scaling_mode TEXT NOT NULL DEFAULT 'fixedAspect'"
      )
      statement.executeUpdate(
        "ALTER TABLE ui_button_templates ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'business'"
      )
      statement.executeUpdate("CREATE INDEX IF NOT EXISTS ui_button_templates_name_idx ON ui_button_templates(name)")
    } finally {
      statement.close()
    }
  }
}
