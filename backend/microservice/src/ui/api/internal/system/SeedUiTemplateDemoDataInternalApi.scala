package microservice.ui.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.ui.support.seed.DemoUiTemplateSeedSupport

/** 模块间 API：system 在 JDBC 模式下写入 UI 模板演示数据；不挂路由。 */
final case class SeedUiTemplateDemoDataInternalAPIMessage(createdAt: String) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      PlanSteps.read(DemoUiTemplateSeedSupport.seedJdbcIfEmpty(connection, createdAt))
    }
}
