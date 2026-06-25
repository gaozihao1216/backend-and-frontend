package microservice.user.api.internal.player

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.tables.user.UserTable

/** 模块间 API：确认用户存在；由 player 社交 API 调用，不挂路由。 */
final case class UserExistsInternalAPIMessage(userId: String) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      EitherT.liftF(IO(UserTable.findById(connection, userId))).flatMap {
        case None =>
          EitherT.leftT[IO, Unit](HttpError.notFound("FRIEND_NOT_FOUND", s"User not found: $userId"))
        case Some(_) =>
          EitherT.rightT[IO, HttpError](())
      }
    }
}
