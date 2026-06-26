package microservice.user.support

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.{AdminLevel, UserRole}
import microservice.user.tables.user.{UserRow, UserTable}
import org.http4s.Status

import java.sql.Connection

/** 全项目共用的权限校验（演示级 x-user-id + UserTable 查表）。
  *
  * 各方法统一返回 IO[Either[HttpError, A]]，API plan 内通过 PlanSteps.fromEither 接入。
  */
object AccessControl {

  /** 校验 userId 存在且 role 精确匹配。 */
  def requireRole(connection: Connection, userId: String, role: UserRole): IO[Either[HttpError, UserRow]] =
    IO(UserTable.findById(connection, userId)).map {
      case Some(user) if user.role == role =>
        Right(user)
      case Some(_) =>
        Left(HttpError.forbidden(s"${role.value} role is required"))
      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }

  /** 校验 admin 用户且 adminLevel 精确匹配（standard 与 director 隔离）。 */
  def requireAdminLevel(connection: Connection, userId: String, adminLevel: AdminLevel): IO[Either[HttpError, UserRow]] =
    IO(UserTable.findById(connection, userId)).map {
      case Some(user) if user.role == UserRole.Admin && user.adminLevel.contains(adminLevel) =>
        Right(user)
      case Some(user) if user.role == UserRole.Admin =>
        Left(HttpError.forbidden(s"${adminLevel.value} admin level is required"))
      case Some(_) =>
        Left(HttpError.forbidden("admin role is required"))
      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }

  /** 校验路由层 x-user-id 与 APIMessage.token 一致。 */
  def requireBoundIdentity(headerUserId: String, token: String): IO[Either[HttpError, Unit]] =
    IO.pure(checkBoundIdentity(headerUserId, token))

  /** 校验 userId 存在（不限 role）。 */
  def requireKnownUser(connection: Connection, userId: String): IO[Either[HttpError, UserRow]] =
    IO(UserTable.findById(connection, userId)).map {
      case None =>
        Left(HttpError.unauthorized("Unknown user"))
      case Some(user) =>
        Right(user)
    }

  /** 同步角色校验，供单元测试。 */
  def checkRole(connection: Connection, userId: String, role: UserRole): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case Some(user) if user.role == role =>
        Right(user)
      case Some(_) =>
        Left(HttpError.forbidden(s"${role.value} role is required"))
      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }

  /** 同步 admin 等级校验，供单元测试。 */
  def checkAdminLevel(connection: Connection, userId: String, adminLevel: AdminLevel): Either[HttpError, UserRow] =
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

  /** 同步用户存在校验，供单元测试。 */
  def checkKnownUser(connection: Connection, userId: String): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case None    => Left(HttpError.unauthorized("Unknown user"))
      case Some(user) => Right(user)
    }

  /** 同步身份绑定校验，供单元测试。 */
  def checkBoundIdentity(headerUserId: String, token: String): Either[HttpError, Unit] =
    if (headerUserId.trim.isEmpty || token.trim.isEmpty) {
      Left(HttpError.unauthorized("Missing user identity"))
    } else if (headerUserId != token) {
      Left(HttpError(Status.Forbidden, "USER_ID_MISMATCH", "x-user-id does not match request identity"))
    } else {
      Right(())
    }
}
