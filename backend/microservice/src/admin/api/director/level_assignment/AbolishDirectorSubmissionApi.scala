package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.api.internal.RecordReviewAuditInternalAPIMessage
import microservice.admin.objects.level.AdminSubmissionWithLevel
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.system.objects.{AdminLevel, AuditTargetType, SubmissionStatus}
import microservice.admin.body.director.level_assignment.AbolishDirectorSubmissionBody
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.AbolishApprovedSubmissionInternalAPIMessage
import microservice.user.utils.AccessControl

/** POST /admin/director/submissions/:submissionId/abolish — 总监废止已批准投稿。 */
final case class AbolishDirectorSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: AbolishDirectorSubmissionBody
) extends APIWithTokenMessage[AdminSubmissionWithLevel] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminSubmissionWithLevel]] =
    PlanSteps.finish {
      for {
        user <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        timestamp = java.time.Instant.now().toString
        abolishNote = body.note.filter(_.trim.nonEmpty).map(_.trim)
        result <- PlanSteps.runApi(
          AbolishApprovedSubmissionInternalAPIMessage(submissionId, user.id, abolishNote),
          connection
        )
        _ <- PlanSteps.runApi(
          RecordReviewAuditInternalAPIMessage(
            targetType = AuditTargetType.DirectorAbolish,
            submissionId = submissionId,
            reviewerId = user.id,
            decision = SubmissionStatus.Abolished.value,
            reviewNote = abolishNote,
            reviewedAt = timestamp
          ),
          connection
        )
      } yield LevelHandoffMapping.toSubmissionWithLevel(result)
    }
}
