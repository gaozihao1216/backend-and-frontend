package microservice.admin.api.director.permissions

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.permissions.DirectorTransferResult
import microservice.admin.support.permissions.DirectorPermissionAccess
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.admin.api.director.permissions.body.TransferDirectorPermissionBody

/** 总监权限移交 APIMessage：当前 Director 降为 Standard，目标 Admin 升为 Director。 */
final case class TransferDirectorPermissionAPIMessage(
  currentDirectorId: String,
  body: TransferDirectorPermissionBody
) extends APIWithTokenMessage[DirectorTransferResult] {
  override def token: String = currentDirectorId

  /** plan 定义了什么业务流程：原子交换两位管理员的 adminLevel，保证系统中始终有且仅有一位 Director。
    *
    * 解决了什么问题：总监离职或轮换时需安全移交 UI 定制、槽位分配等高级权限。
    * 在事务内起到什么作用：连续两次 UserTable.updateAdminLevel；任一失败则 Left 整笔回滚。
    * 关联的 HTTP 路由/前端 API：POST /admin/director/transfer；前端 `TransferDirectorPermissionApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorTransferResult]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, currentDirectorId, AdminLevel.Director).map(_ => ())
        _ <- DirectorPermissionAccess.requireNotSelfTransfer(currentDirectorId, body.targetAdminId)
        _ <- DirectorPermissionAccess.requireTargetAdmin(connection, body.targetAdminId)
        result <- DirectorPermissionAccess.requireTransfer(connection, currentDirectorId, body.targetAdminId)
      } yield result
    }
}
