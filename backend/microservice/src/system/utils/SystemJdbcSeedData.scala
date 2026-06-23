package microservice.system.utils

import java.sql.Connection
import microservice.level.support.seed.DemoLevelSeedSupport
import microservice.player.support.seed.PlayerRuntimeSeedSupport
import microservice.ui.support.seed.DemoUiTemplateSeedSupport

/** JDBC 模式演示数据：与 in-memory seed 对齐的幂等写入。 */
private[utils] object SystemJdbcSeedData {
  def seed(connection: Connection): Unit = {
    val createdAt = DemoLevelSeedSupport.jdbcDemoTimestamp
    val reviewedAt = createdAt

    DemoLevelSeedSupport.seedJdbcIfEmpty(connection, createdAt, reviewedAt)
    DemoUiTemplateSeedSupport.seedJdbcIfEmpty(connection, createdAt)
    PlayerRuntimeSeedSupport.seedCheckInPanelIfEmpty(connection)
  }
}
