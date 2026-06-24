package microservice.user.support.bootstrap

import java.sql.Connection
import microservice.user.tables.user.UserTableInitializer

/** user 模块存储初始化入口（供 system 启动编排调用）。 */
private[user] object UserStorageBootstrap {
  def initialize(connection: Connection): Unit =
    UserTableInitializer.initialize(connection)
}
