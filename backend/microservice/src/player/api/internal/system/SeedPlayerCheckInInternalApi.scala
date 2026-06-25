package microservice.player.api.internal.system

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.support.seed.PlayerCheckInSeedSupport

/** 模块间 API：系统启动时初始化玩家签到演示奖励；由 system seed 编排调用，不挂路由。 */
final case class SeedPlayerCheckInInternalAPIMessage() extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      PlanSteps.read(PlayerCheckInSeedSupport.seedCheckInPanelIfEmpty(connection))
    }
}
