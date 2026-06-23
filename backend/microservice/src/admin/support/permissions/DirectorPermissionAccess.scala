package microservice.admin.support.permissions

import java.sql.Connection
import java.time.Instant
import microservice.admin.objects.director.permissions.{DirectorTransferResult, TransferDirectorPermissionErrors}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, UserRole}
import microservice.user.tables.user.UserTable

/** 总监权限移交的前置校验与原子写操作。 */
object DirectorPermissionAccess {
  def requireNotSelfTransfer(currentDirectorId: String, targetAdminId: String): Step[Unit] =
    PlanStep.fromEither(checkNotSelfTransfer(currentDirectorId, targetAdminId))

  def requireTargetAdmin(connection: Connection, targetAdminId: String): Step[Unit] =
    PlanStep.fromEither(checkTargetAdmin(connection, targetAdminId))

  def requireTransfer(connection: Connection, currentDirectorId: String, targetAdminId: String): Step[DirectorTransferResult] =
    PlanStep.fromEither(checkTransfer(connection, currentDirectorId, targetAdminId))

  def checkNotSelfTransfer(currentDirectorId: String, targetAdminId: String): Either[HttpError, Unit] =
    if (targetAdminId == currentDirectorId) {
      Left(TransferDirectorPermissionErrors.CannotTransferToSelf.toHttpError)
    } else {
      Right(())
    }

  def checkTargetAdmin(connection: Connection, targetAdminId: String): Either[HttpError, Unit] =
    UserTable.findById(connection, targetAdminId) match {
      case None =>
        Left(TransferDirectorPermissionErrors.TargetMissing(targetAdminId).toHttpError)
      case Some(target) if target.role != UserRole.Admin =>
        Left(TransferDirectorPermissionErrors.TargetNotAdmin(targetAdminId).toHttpError)
      case Some(_) =>
        Right(())
    }

  def checkTransfer(
    connection: Connection,
    currentDirectorId: String,
    targetAdminId: String
  ): Either[HttpError, DirectorTransferResult] = {
    val timestamp = Instant.now().toString
    val demoted = UserTable.updateAdminLevel(connection, currentDirectorId, Some(AdminLevel.Standard), timestamp)
    val promoted = UserTable.updateAdminLevel(connection, targetAdminId, Some(AdminLevel.Director), timestamp)

    (demoted, promoted) match {
      case (Some(_), Some(_)) =>
        Right(DirectorTransferResult(currentDirectorId, targetAdminId))
      case _ =>
        Left(TransferDirectorPermissionErrors.TransferFailed(targetAdminId).toHttpError)
    }
  }
}
