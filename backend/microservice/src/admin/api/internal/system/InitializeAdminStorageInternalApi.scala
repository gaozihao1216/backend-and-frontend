package microservice.admin.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.admin.support.bootstrap.AdminStorageBootstrap
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：system 启动时初始化 admin 存储；不挂路由。 */
final case class InitializeAdminStorageInternalAPIMessage() extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      PlanSteps.read(AdminStorageBootstrap.initialize(connection))
    }
}
