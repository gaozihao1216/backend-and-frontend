package microservice.user.api.internal.player

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.support.handoff.UserDisplaySupport

/** 模块间 API：确认用户存在；由 player 社交 API 调用，不挂路由。 */
final case class UserExistsInternalAPIMessage(userId: String) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      UserDisplaySupport.requireExists(connection, userId)
    }
}
