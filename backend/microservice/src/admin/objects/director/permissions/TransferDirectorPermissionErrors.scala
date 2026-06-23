package microservice.admin.objects.director.permissions

import microservice.infrastructure.http.HttpError

/** 总监权限移交 API 的业务错误 sealed trait。 */
sealed trait TransferDirectorPermissionApiError {
  def toHttpError: HttpError
}

/** 总监权限移交相关错误码，供 TransferDirectorPermissionAPIMessage 使用。 */
private[admin] object TransferDirectorPermissionErrors {
  /** 目标 admin 用户不存在 → 404 TARGET_ADMIN_NOT_FOUND */
  final case class TargetMissing(userId: String) extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("TARGET_ADMIN_NOT_FOUND", s"Target admin not found: $userId")
  }

  /** 目标用户存在但 role 不是 Admin → 400 TARGET_NOT_ADMIN */
  final case class TargetNotAdmin(userId: String) extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("TARGET_NOT_ADMIN", s"Target user is not an admin: $userId")
  }

  /** 不可将总监权限移交给自己 → 400 CANNOT_TRANSFER_TO_SELF */
  final case object CannotTransferToSelf extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("CANNOT_TRANSFER_TO_SELF", "Cannot transfer director permission to self")
  }

  /** 数据库更新 adminLevel 失败（降级/升级任一未成功）→ 409 DIRECTOR_TRANSFER_FAILED */
  final case class TransferFailed(userId: String) extends TransferDirectorPermissionApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("DIRECTOR_TRANSFER_FAILED", s"Failed to transfer director permission to: $userId")
  }
}
