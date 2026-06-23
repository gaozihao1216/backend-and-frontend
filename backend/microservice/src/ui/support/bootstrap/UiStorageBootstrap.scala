package microservice.ui.support.bootstrap

import java.sql.Connection
import microservice.ui.tables.button_template.ButtonTemplateTable
import microservice.ui.tables.stretch_visual_template.StretchVisualTemplateTable
import microservice.ui.tables.ui_page.UiPageTable
import microservice.ui.tables.ui_page_rollback.UiPageRollbackTable

/** ui 模块存储初始化入口（供 system 启动编排调用）。 */
object UiStorageBootstrap {
  def initialize(connection: Connection): Unit = {
    UiPageTable.initialize(connection)
    UiPageRollbackTable.initialize(connection)
    ButtonTemplateTable.initialize(connection)
    StretchVisualTemplateTable.initialize(connection)
  }
}
