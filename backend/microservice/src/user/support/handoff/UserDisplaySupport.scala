package microservice.user.support.handoff

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.user.objects.handoff.UserDisplaySummary
import microservice.user.tables.user.UserTable

/** 用户展示信息读取（user 模块内，供 internal API 复用）。 */
private[user] object UserDisplaySupport {
  def requireExists(connection: Connection, userId: String): Step[Unit] =
    EitherT.liftF(IO(UserTable.findById(connection, userId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("FRIEND_NOT_FOUND", s"User not found: $userId"))
      case Some(_) =>
        EitherT.rightT(())
    }

  def listSummaries(connection: Connection, userIds: List[String]): List[UserDisplaySummary] =
    userIds.flatMap { userId =>
      UserTable.findById(connection, userId).map { user =>
        UserDisplaySummary(userId = user.id, displayName = user.displayName)
      }
    }
}
