package microservice.player.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.support.bootstrap.PlayerStorageBootstrap

/** 模块间 API：system 启动时初始化 player 存储；不挂路由。 */
final case class InitializePlayerStorageInternalAPIMessage(systemBirdTypes: Vector[String]) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      PlanSteps.read(PlayerStorageBootstrap.initialize(connection, systemBirdTypes))
    }
}
