package microservice.core

import microservice.auth.tables.{UserRow, UserTable}
import microservice.system.objects.UserRole

object AccessControl {
  def requireRole(userId: String, role: UserRole): Either[HttpError, UserRow] =
    UserTable.findById(userId) match {
      case Some(user) if user.role == role => Right(user)
      case Some(_) => Left(HttpError.forbidden(s"${role.value} role is required"))
      case None => Left(HttpError.unauthorized("Unknown user"))
    }
}
