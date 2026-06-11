package microservice.user.utils

import microservice.user.tables.user.{UserRow, UserTable}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, UserRole}

import java.sql.Connection

/** 全项目共用的权限校验工具（演示级，基于 x-user-id + UserTable 查表）。
  *
  * 被 level / admin / ui / bird 等模块的 APIMessage 在 plan 开头调用。
  * 生产环境应替换为 session/token 解析，而非直接信任 header 中的 userId。
  */
object AccessControl {

  /** 校验 userId 对应用户存在且 role 匹配。
    *
    * @return Right(UserRow) 校验通过，可继续业务；Left 为 401/403
    */
  def requireRole(connection: Connection, userId: String, role: UserRole): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      // 用户存在且角色一致
      case Some(user) if user.role == role =>
        Right(user)

      // 用户存在但角色不对 → 403
      case Some(_) =>
        Left(HttpError.forbidden(s"${role.value} role is required"))

      // 未知 userId → 401
      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }

  /** 校验 admin 用户且 adminLevel 精确匹配（standard 与 director 权限隔离）。
    *
    * 例如：总监 UI API 要求 Director；普通审核 API 要求 Standard。
    */
  def requireAdminLevel(connection: Connection, userId: String, adminLevel: AdminLevel): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case Some(user) if user.role == UserRole.Admin && user.adminLevel.contains(adminLevel) =>
        Right(user)

      // 是 admin 但等级不够（如 standard 访问 director 接口）
      case Some(user) if user.role == UserRole.Admin =>
        Left(HttpError.forbidden(s"${adminLevel.value} admin level is required"))

      // 非 admin 角色
      case Some(_) =>
        Left(HttpError.forbidden("admin role is required"))

      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }
}
