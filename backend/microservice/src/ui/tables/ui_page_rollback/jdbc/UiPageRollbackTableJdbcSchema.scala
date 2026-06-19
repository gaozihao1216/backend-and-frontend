package microservice.ui.tables.ui_page_rollback.jdbc

import java.sql.Connection

/** ui_page_rollbacks 表的 JDBC DDL 初始化。
  *
  * 定义：page_id 为主键，page_json 存储完整 PageConfig JSON。
  * 关联：UiPageRollbackTable.initialize 在 JDBC 模式下调用。
  */
private[tables] object UiPageRollbackTableJdbcSchema {
  /** 创建 ui_page_rollbacks 表（IF NOT EXISTS）。 */
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS ui_page_rollbacks (
            page_id TEXT PRIMARY KEY,
            page_json TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
