package microservice.testsupport

import microservice.infrastructure.database.DatabaseSession
import microservice.system.utils.SystemDefaults

/** 测试共用 fixture：触发种子数据并复用与 Main 相同的 DatabaseSession。 */
object TestSupport {
  lazy val session: DatabaseSession = SystemDefaults.databaseSession

  def seed(): Unit = {
    val _ = session
  }
}
