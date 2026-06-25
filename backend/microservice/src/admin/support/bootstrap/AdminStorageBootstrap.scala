package microservice.admin.support.bootstrap

import java.sql.Connection
import microservice.admin.tables.AdminAuditTableInitializer

/** admin 模块存储初始化入口（供 system 启动编排调用）。
  *
  * bootstrap 只负责建表顺序，不放业务默认数据；需要种子数据时应放到 seed support。
  */
private[admin] object AdminStorageBootstrap {
  /** 初始化 admin 模块当前拥有的表。 */
  def initialize(connection: Connection): Unit =
    AdminAuditTableInitializer.initialize(connection)
}
