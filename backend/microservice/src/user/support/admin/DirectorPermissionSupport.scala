package microservice.user.support.admin

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, UserRole}
import microservice.user.objects.handoff.DirectorAdminLevelTransferResult
import microservice.user.tables.user.UserTable

/** 总监 adminLevel 读写（user 模块内，供 internal API 复用）。 */
private[user] object DirectorPermissionSupport {
  def requireValidateAdminTransferTarget(connection: Connection, targetAdminId: String): Step[Unit] =
    EitherT.liftF(IO(UserTable.findById(connection, targetAdminId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("TARGET_ADMIN_NOT_FOUND", s"Target admin not found: $targetAdminId"))
      case Some(target) if target.role != UserRole.Admin =>
        EitherT.leftT(HttpError.badRequest("TARGET_NOT_ADMIN", s"Target user is not an admin: $targetAdminId"))
      case Some(_) =>
        EitherT.rightT(())
    }

  def requireTransferDirector(
    connection: Connection,
    currentDirectorId: String,
    targetAdminId: String
  ): Step[DirectorAdminLevelTransferResult] =
    EitherT.liftF(IO {
      val timestamp = Instant.now().toString
      val demoted = UserTable.updateAdminLevel(connection, currentDirectorId, Some(AdminLevel.Standard), timestamp)
      val promoted = UserTable.updateAdminLevel(connection, targetAdminId, Some(AdminLevel.Director), timestamp)
      (demoted, promoted)
    }).flatMap {
      case (Some(_), Some(_)) =>
        EitherT.rightT(DirectorAdminLevelTransferResult(fromUserId = currentDirectorId, toUserId = targetAdminId))
      case _ =>
        EitherT.leftT(
          HttpError.conflict("DIRECTOR_TRANSFER_FAILED", s"Failed to transfer director permission to: $targetAdminId")
        )
    }
}
