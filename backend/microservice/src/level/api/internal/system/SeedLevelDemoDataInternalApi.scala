package microservice.level.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.support.seed.DemoLevelSeedSupport

/** 模块间 API：system 在 JDBC 模式下写入 level 演示数据；不挂路由。 */
final case class SeedLevelDemoDataInternalAPIMessage(createdAt: String, reviewedAt: String) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      PlanSteps.read(DemoLevelSeedSupport.seedJdbcIfEmpty(connection, createdAt, reviewedAt))
    }
}
