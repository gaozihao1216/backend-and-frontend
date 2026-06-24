package microservice.admin.support.permissions

import java.sql.Connection
import microservice.admin.objects.director.permissions.{DirectorTransferResult, TransferDirectorPermissionErrors}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.api.PlanSteps
import microservice.infrastructure.http.HttpError
import microservice.user.api.internal.admin.{
  TransferDirectorAdminLevelInternalAPIMessage,
  ValidateAdminTransferTargetInternalAPIMessage
}

/** 总监权限移交的前置校验与原子写操作（经 user internal API）。 */
private[admin] object DirectorPermissionAccess {
  def requireNotSelfTransfer(currentDirectorId: String, targetAdminId: String): Step[Unit] =
    if (targetAdminId == currentDirectorId) {
      PlanStep.fail(TransferDirectorPermissionErrors.CannotTransferToSelf.toHttpError)
    } else {
      PlanStep.succeed(())
    }

  def requireTargetAdmin(connection: Connection, targetAdminId: String): Step[Unit] =
    PlanSteps.runApi(ValidateAdminTransferTargetInternalAPIMessage(targetAdminId), connection).map(_ => ())

  def requireTransfer(connection: Connection, currentDirectorId: String, targetAdminId: String): Step[DirectorTransferResult] =
    PlanSteps
      .runApi(TransferDirectorAdminLevelInternalAPIMessage(currentDirectorId, targetAdminId), connection)
      .map(result => DirectorTransferResult(result.fromUserId, result.toUserId))

  def checkNotSelfTransfer(currentDirectorId: String, targetAdminId: String): Either[HttpError, Unit] =
    if (targetAdminId == currentDirectorId) {
      Left(TransferDirectorPermissionErrors.CannotTransferToSelf.toHttpError)
    } else {
      Right(())
    }
}
