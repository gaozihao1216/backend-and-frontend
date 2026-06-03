package microservice.admin.objects

import microservice.infrastructure.http.HttpError

sealed trait TransferDirectorPermissionApiError {
  def toHttpError: HttpError
}

object TransferDirectorPermissionErrors {
  final case class TargetMissing(userId: String) extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("TARGET_ADMIN_NOT_FOUND", s"Target admin not found: $userId")
  }

  final case class TargetNotAdmin(userId: String) extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("TARGET_NOT_ADMIN", s"Target user is not an admin: $userId")
  }

  final case object CannotTransferToSelf extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("CANNOT_TRANSFER_TO_SELF", "Cannot transfer director permission to self")
  }

  final case class TransferFailed(userId: String) extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("DIRECTOR_TRANSFER_FAILED", s"Failed to transfer director permission to: $userId")
  }
}
