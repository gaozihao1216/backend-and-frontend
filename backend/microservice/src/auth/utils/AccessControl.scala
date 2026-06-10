package microservice.auth.utils

import microservice.auth.tables.user.{UserRow, UserTable}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, UserRole}

import java.sql.Connection

/** 角色与管理员等级校验，供各 APIMessage.plan 在执行业务前调用。
  *
  * 实现：通过 UserTable.findById 查当前 x-user-id 对应用户，比对 role / adminLevel。
  * 关联：设计师/玩家 API 用 requireRole；总监 UI API 用 requireAdminLevel(Director)。
  * 注意：这是演示级鉴权，生产环境需替换为真实 token/session 校验。
  */
object AccessControl {
  /** 校验用户存在且角色匹配（如 UserRole.Designer）。 */
  def requireRole(connection: Connection, userId: String, role: UserRole): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case Some(user) if user.role == role => Right(user)
      case Some(_) => Left(HttpError.forbidden(s"${role.value} role is required"))
      case None => Left(HttpError.unauthorized("Unknown user"))
    }

  /** 校验 admin 用户且 adminLevel 精确匹配（standard 与 director 权限隔离）。 */
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
