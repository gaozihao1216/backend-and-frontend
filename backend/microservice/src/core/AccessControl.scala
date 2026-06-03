package microservice.core

import microservice.auth.tables.{UserRow, UserTable}
import microservice.system.objects.UserRole
import java.sql.Connection

object AccessControl {
  def requireRole(connection: Connection, userId: String, role: UserRole): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case Some(user) if user.role == role => Right(user)
      case Some(_) => Left(HttpError.forbidden(s"${role.value} role is required"))
      case None => Left(HttpError.unauthorized("Unknown user"))
    }
}
