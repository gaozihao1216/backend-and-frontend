package microservice.level.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.support.bootstrap.LevelStorageBootstrap

/** 模块间 API：system 启动时初始化 level 存储；不挂路由。 */
final case class InitializeLevelStorageInternalAPIMessage() extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      PlanSteps.read(LevelStorageBootstrap.initialize(connection))
    }
}
