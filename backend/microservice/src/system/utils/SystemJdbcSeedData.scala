package microservice.system.utils

import cats.effect.unsafe.implicits.global
import java.sql.Connection
import microservice.level.api.internal.system.SeedLevelDemoDataInternalAPIMessage
import microservice.player.api.internal.system.SeedPlayerRuntimeInternalAPIMessage
import microservice.ui.api.internal.system.SeedUiTemplateDemoDataInternalAPIMessage

/** JDBC 演示数据：启动时进行幂等写入。 */
private[utils] object SystemJdbcSeedData {
  def seed(connection: Connection): Unit = {
    val createdAt = "2026-06-03T00:00:00Z"
    val reviewedAt = createdAt

    runInternal(SeedLevelDemoDataInternalAPIMessage(createdAt, reviewedAt).plan(connection), "seed level demo data")
    runInternal(SeedUiTemplateDemoDataInternalAPIMessage(createdAt).plan(connection), "seed UI demo data")
    runInternal(SeedPlayerRuntimeInternalAPIMessage().plan(connection), "seed player runtime")
  }

  private def runInternal(action: cats.effect.IO[Either[microservice.infrastructure.http.HttpError, Unit]], label: String): Unit =
    action.unsafeRunSync() match {
      case Right(_)    => ()
      case Left(error) => throw new IllegalStateException(s"Failed to $label: ${error.message}")
    }
}
