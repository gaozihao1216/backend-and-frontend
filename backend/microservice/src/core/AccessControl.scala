package microservice.core

import microservice.auth.tables.{UserRow, UserTable}
import microservice.system.objects.{AdminLevel, UserRole}
import java.sql.Connection

object AccessControl {
  def requireRole(connection: Connection, userId: String, role: UserRole): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case Some(user) if user.role == role => Right(user)
      case Some(_) => Left(HttpError.forbidden(s"${role.value} role is required"))
      case None => Left(HttpError.unauthorized("Unknown user"))
    }

  def requireAdminLevel(connection: Connection, userId: String, adminLevel: AdminLevel): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case Some(user) if user.role == UserRole.Admin && user.adminLevel.contains(adminLevel) =>
        Right(user)
      case Some(user) if user.role == UserRole.Admin =>
        Left(HttpError.forbidden(s"${adminLevel.value} admin level is required"))
      case Some(_) =>
        Left(HttpError.forbidden("admin role is required"))
      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }
}
