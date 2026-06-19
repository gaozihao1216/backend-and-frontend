package microservice.admin.api.director.permissions

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.permissions.DirectorPermissionSummary
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.system.objects.AdminLevel

/** 查询当前总监的权限摘要（含 UI 定制能力标志）。
  *
  * 实现：requireAdminLevel(Director) → 构造 DirectorPermissionSummary（canManageUiCustomization 恒为 true）。
  * 关联：GET /admin/director/permissions；前端 Director 面板初始化时调用。
  */
final case class GetDirectorPermissionsAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorPermissionSummary] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorPermissionSummary]] =
    PlanSteps.finish {
      for {
        user <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
      } yield DirectorPermissionSummary(
        userId = user.id,
        adminLevel = AdminLevel.Director,
        canManageUiCustomization = true
      )
    }
}
