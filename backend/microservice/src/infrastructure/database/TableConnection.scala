package microservice.infrastructure.database

import java.sql.Connection

/** Table 层对 [[DatabaseSession]] 哨兵约定的统一判断：in-memory 模式传入 `null` Connection。 */
object TableConnection {
  def isInMemory(connection: Connection): Boolean =
    connection == null
}
