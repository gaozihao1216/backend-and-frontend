package microservice.user.utils

import microservice.user.tables.user.{UserRow, UserTable}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, UserRole}
import org.http4s.Status

import java.sql.Connection

/** 全项目共用的权限校验工具（演示级 x-user-id + UserTable 查表）。
  *
  * 定义：requireRole / requireAdminLevel / requireBoundIdentity 三个入口。
  * 问题：多模块 APIMessage 需一致的角色与 admin 等级校验，避免复制粘贴。
  * 作用：返回 Either[HttpError, UserRow] 供 PlanSteps.require 短路。
  * 关联：level/admin/ui/bird/player 各 APIMessage；生产应换 token/session。
  */
object AccessControl {

  /** 校验 userId 存在且 role 精确匹配。
    *
    * 定义：UserTable.findById + role 等值比较。
    * 问题：设计师 API 被 player 调用应 403 而非 404。
    * 作用：Right(UserRow) 继续业务；Left 401/403。
    * 关联：[[UserRole]]；各 designer/admin APIMessage 首步。
    */
  def requireRole(connection: Connection, userId: String, role: UserRole): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      // --- 1. 用户存在且角色一致 → 通过 ---
      case Some(user) if user.role == role =>
        Right(user)

      // --- 2. 用户存在但角色不对 → 403 ---
      case Some(_) =>
        Left(HttpError.forbidden(s"${role.value} role is required"))

      // --- 3. 未知 userId → 401 ---
      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }

  /** 校验 admin 用户且 adminLevel 精确匹配（standard 与 director 隔离）。
    *
    * 定义：role==Admin 且 adminLevel Option 含目标等级。
    * 问题：director 专属 API 不能被 standard admin 调用。
    * 作用：总监 UI/槽位/鸟技能 API 的权限门闩。
    * 关联：[[AdminLevel]]；admin/director 包下 APIMessage。
    */
  def requireAdminLevel(connection: Connection, userId: String, adminLevel: AdminLevel): Either[HttpError, UserRow] =
    UserTable.findById(connection, userId) match {
      case Some(user) if user.role == UserRole.Admin && user.adminLevel.contains(adminLevel) =>
        Right(user)

      // --- admin 但等级不够 ---
      case Some(user) if user.role == UserRole.Admin =>
        Left(HttpError.forbidden(s"${adminLevel.value} admin level is required"))

      // --- 非 admin ---
      case Some(_) =>
        Left(HttpError.forbidden("admin role is required"))

      case None =>
        Left(HttpError.unauthorized("Unknown user"))
    }

  /** 校验路由层 x-user-id 与 APIMessage.token 一致。
    *
    * 定义：字符串相等比较，空值视为未认证。
    * 问题：header 与构造参数不一致可能导致越权（用 A 的 header 操作 B 的资源）。
    * 作用：APIWithTokenMessage.runAuthenticated 前置检查。
    * 关联：[[AuthMiddleware]]；USER_ID_MISMATCH 403。
    */
  def requireBoundIdentity(headerUserId: String, token: String): Either[HttpError, Unit] =
    if (headerUserId.trim.isEmpty || token.trim.isEmpty) {
      Left(HttpError.unauthorized("Missing user identity"))
    } else if (headerUserId != token) {
      Left(HttpError(Status.Forbidden, "USER_ID_MISMATCH", "x-user-id does not match request identity"))
    } else {
      Right(())
    }
}
