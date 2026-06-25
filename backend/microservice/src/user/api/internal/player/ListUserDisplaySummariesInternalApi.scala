package microservice.user.api.internal.player

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.objects.handoff.UserDisplaySummary
import microservice.user.tables.user.UserTable

/** 模块间 API：批量读取用户展示名；由 player 社交 API 调用，不挂路由。 */
final case class ListUserDisplaySummariesInternalAPIMessage(userIds: List[String])
    extends APIMessage[List[UserDisplaySummary]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[UserDisplaySummary]]] =
    PlanSteps.finish {
      PlanSteps.read(
        userIds.flatMap { userId =>
          UserTable.findById(connection, userId).map { user =>
            UserDisplaySummary(userId = user.id, displayName = user.displayName)
          }
        }
      )
    }
}
