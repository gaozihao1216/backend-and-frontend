package microservice.admin.api.director.permissions

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.admin.objects.director.permissions.{DirectorTransferResult, TransferDirectorPermissionErrors}
import microservice.user.tables.user.UserTable
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, UserRole}

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
        // 步骤 1：校验当前用户为 Director
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, currentDirectorId, AdminLevel.Director).map(_ => ()))
        // 步骤 2：禁止移交给自己 → CANNOT_TRANSFER_TO_SELF
        _ <- PlanSteps.require(
          if (body.targetAdminId == currentDirectorId) {
            Left(TransferDirectorPermissionErrors.CannotTransferToSelf.toHttpError)
          } else {
            Right(())
          }
        )
        // 步骤 3：校验目标用户存在且 role 为 Admin
        _ <- PlanSteps.require(
          UserTable.findById(connection, body.targetAdminId) match {
            case None =>
              Left(TransferDirectorPermissionErrors.TargetMissing(body.targetAdminId).toHttpError)
            case Some(target) if target.role != UserRole.Admin =>
              Left(TransferDirectorPermissionErrors.TargetNotAdmin(body.targetAdminId).toHttpError)
            case Some(_) =>
              Right(())
          }
        )
        // 步骤 4：原子降级当前 Director、升级目标 Admin
        result <- PlanSteps.require(
          {
            val timestamp = Instant.now().toString
            val demoted = UserTable.updateAdminLevel(connection, currentDirectorId, Some(AdminLevel.Standard), timestamp)
            val promoted = UserTable.updateAdminLevel(connection, body.targetAdminId, Some(AdminLevel.Director), timestamp)

            (demoted, promoted) match {
              case (Some(_), Some(_)) =>
                Right(DirectorTransferResult(currentDirectorId, body.targetAdminId))
              case _ =>
                Left(TransferDirectorPermissionErrors.TransferFailed(body.targetAdminId).toHttpError)
            }
          }
        )
      // 返回前任与新任 Director 的用户 ID
      } yield result
    }
}
