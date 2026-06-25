package microservice.admin.api.director.permissions

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.permissions.DirectorPermissionSummary
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.support.AccessControl
import microservice.system.objects.enums.AdminLevel

/** 查询当前总监权限摘要 APIMessage（含 UI 定制能力标志）。 */
final case class GetDirectorPermissionsAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorPermissionSummary] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 管理员获取自身权限摘要，用于前端初始化总监面板。
    *
    * 解决了什么问题：前端需知道当前用户是否为 Director 以及能否管理 UI 定制。
    * 在事务内起到什么作用：只读校验 adminLevel，构造 DirectorPermissionSummary；无 DB 写入。
    * 关联的前端 API：GET /admin/director/permissions；前端 `GetDirectorPermissionsApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorPermissionSummary]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限并加载 User 记录
        user <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
      // 返回权限摘要；canManageUiCustomization 对 Director 恒为 true
      } yield DirectorPermissionSummary(
        userId = user.id,
        adminLevel = AdminLevel.Director,
        canManageUiCustomization = true
      )
    }
}
