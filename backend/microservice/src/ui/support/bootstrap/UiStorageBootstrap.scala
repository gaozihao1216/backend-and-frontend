package microservice.ui.support.bootstrap

import java.sql.Connection
import microservice.ui.tables.button_template.ButtonTemplateTableInitializer
import microservice.ui.tables.stretch_visual_template.StretchVisualTemplateTableInitializer
import microservice.ui.tables.ui_page.UiPageTableInitializer
import microservice.ui.tables.ui_page_rollback.UiPageRollbackTableInitializer

/** ui 模块存储初始化入口（供 system 启动编排调用）。 */
private[ui] object UiStorageBootstrap {
  def initialize(connection: Connection): Unit = {
    UiPageTableInitializer.initialize(connection)
    UiPageRollbackTableInitializer.initialize(connection)
    ButtonTemplateTableInitializer.initialize(connection)
    StretchVisualTemplateTableInitializer.initialize(connection)
  }
}
