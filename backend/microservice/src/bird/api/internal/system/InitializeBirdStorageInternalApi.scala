package microservice.bird.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.bird.support.bootstrap.BirdStorageBootstrap
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：system 启动时初始化 bird 存储；不挂路由。 */
final case class InitializeBirdStorageInternalAPIMessage() extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      PlanSteps.read(BirdStorageBootstrap.initialize(connection))
    }
}
