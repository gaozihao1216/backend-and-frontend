package microservice.admin.api.audit

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.submission.ReviewAudit
import microservice.admin.tables.AdminAuditTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.support.AccessControl
import microservice.system.objects.enums.AdminLevel

/** GET /admin/audit-logs — 查询审核审计记录（Standard 管理员）。 */
final case class ListAdminAuditLogsAPIMessage(
  userId: String,
  submissionId: Option[String] = None,
  reviewerId: Option[String] = None,
  targetType: Option[String] = None
) extends APIWithTokenMessage[List[ReviewAudit]] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员按可选筛选条件查询审核审计记录。
    *
    * 解决了什么问题：后台需追溯关卡/鸟类投稿的审核历史与总监废止操作。
    * 在事务内起到什么作用：只读查询 AdminAuditTable；权限失败则整笔回滚（无副作用）。
    * 关联的前端 API：GET /admin/audit-logs；前端 `ListAdminAuditLogsApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, List[ReviewAudit]]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Standard 及以上管理员
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard))
        // 步骤 2：按 submissionId > reviewerId > 全量 读取审计 Row
        baseRows <- PlanSteps.read(
          submissionId.filter(_.trim.nonEmpty) match {
            case Some(id) => AdminAuditTable.listBySubmissionId(connection, id.trim)
            case None =>
              reviewerId.filter(_.trim.nonEmpty) match {
                case Some(id) => AdminAuditTable.listByReviewerId(connection, id.trim)
                case None     => AdminAuditTable.listAll(connection)
              }
          }
        )
        // 步骤 3：可选按 targetType 精确过滤
        rows <- PlanSteps.read(
          targetType.filter(_.trim.nonEmpty) match {
            case Some(value) => baseRows.filter(_.targetType == value.trim)
            case None        => baseRows
          }
        )
      } yield rows.map(ReviewAudit.from).toList
    }
}
