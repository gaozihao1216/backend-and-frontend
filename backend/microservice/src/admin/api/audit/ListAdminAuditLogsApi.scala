package microservice.admin.api.audit

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.submission.ReviewAudit
import microservice.admin.tables.{AdminAuditTable, ReviewAuditRow}
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.system.objects.AdminLevel

/** GET /admin/audit-logs — 查询审核审计记录（Standard 管理员）。 */
final case class ListAdminAuditLogsAPIMessage(
  userId: String,
  submissionId: Option[String] = None,
  reviewerId: Option[String] = None,
  targetType: Option[String] = None
) extends APIWithTokenMessage[List[ReviewAudit]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[ReviewAudit]]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        rows <- PlanSteps.read(listRows(connection))
      } yield rows.map(ReviewAudit.from).toList
    }

  private def listRows(connection: Connection): Vector[ReviewAuditRow] = {
    val base =
      submissionId.filter(_.trim.nonEmpty) match {
        case Some(id) => AdminAuditTable.listBySubmissionId(connection, id.trim)
        case None =>
          reviewerId.filter(_.trim.nonEmpty) match {
            case Some(id) => AdminAuditTable.listByReviewerId(connection, id.trim)
            case None     => AdminAuditTable.listAll(connection)
          }
      }

    targetType.filter(_.trim.nonEmpty) match {
      case Some(value) => base.filter(_.targetType == value.trim)
      case None        => base
    }
  }
}
