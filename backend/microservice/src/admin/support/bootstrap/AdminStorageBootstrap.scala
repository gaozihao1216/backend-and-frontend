package microservice.admin.support.bootstrap

import java.sql.Connection
import microservice.admin.tables.AdminAuditTableInitializer

/** admin 模块存储初始化入口（供 system 启动编排调用）。 */
private[admin] object AdminStorageBootstrap {
  def initialize(connection: Connection): Unit =
    AdminAuditTableInitializer.initialize(connection)
}
