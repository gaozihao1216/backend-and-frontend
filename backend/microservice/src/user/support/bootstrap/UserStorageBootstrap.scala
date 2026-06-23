package microservice.user.support.bootstrap

import java.sql.Connection
import microservice.user.tables.user.UserTable

/** user 模块存储初始化入口（供 system 启动编排调用）。 */
object UserStorageBootstrap {
  def initialize(connection: Connection): Unit =
    UserTable.initialize(connection)
}
