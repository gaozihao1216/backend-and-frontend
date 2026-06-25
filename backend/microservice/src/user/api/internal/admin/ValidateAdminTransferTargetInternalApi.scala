package microservice.user.api.internal.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.UserRole
import microservice.user.tables.user.UserTable

/** 模块间 API：校验总监权限移交目标；由 admin HTTP API 调用，不挂路由。 */
final case class ValidateAdminTransferTargetInternalAPIMessage(targetAdminId: String) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      EitherT.liftF(IO(UserTable.findById(connection, targetAdminId))).flatMap {
        case None =>
          EitherT.leftT[IO, Unit](HttpError.notFound("TARGET_ADMIN_NOT_FOUND", s"Target admin not found: $targetAdminId"))
        case Some(target) if target.role != UserRole.Admin =>
          EitherT.leftT[IO, Unit](HttpError.badRequest("TARGET_NOT_ADMIN", s"Target user is not an admin: $targetAdminId"))
        case Some(_) =>
          EitherT.rightT[IO, HttpError](())
      }
    }
}
