package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.admin.tables.{AdminAuditTable, AdminAuditTargetType}
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.submission.SubmissionWithLevel
import microservice.level.tables.level.LevelTable
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}
import microservice.admin.api.director.level_assignment.body.AbolishDirectorSubmissionBody

/** POST /admin/director/submissions/:submissionId/abolish — 总监废止已批准投稿。 */
final case class AbolishDirectorSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: AbolishDirectorSubmissionBody
) extends APIWithTokenMessage[SubmissionWithLevel] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    PlanSteps.finish {
      for {
        user <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        submission <- DirectorLevelAssignmentSupport.requireAbolishableSubmission(connection, submissionId)
        timestamp = java.time.Instant.now().toString
        abolishNote = body.note.filter(_.trim.nonEmpty).map(_.trim)
        result <- PlanSteps.read {
          LevelSlotAssignmentTable.deleteBySubmissionId(connection, submission.id)

          SubmissionTable.updateReview(
            connection = connection,
            submissionId = submission.id,
            status = SubmissionStatus.Abolished,
            reviewerId = user.id,
            reviewNote = abolishNote.orElse(Some("Abolished by director.")),
            reviewedAt = timestamp
          )

          LevelTable.updateReviewStatus(
            connection = connection,
            levelId = submission.levelId,
            status = LevelStatus.Rejected,
            rejectionReason = abolishNote.orElse(Some("Abolished by director.")),
            publishedAt = None,
            updatedAt = timestamp
          )

          DirectorLevelAssignmentSupport
            .submissionWithLevel(connection, submission.id)
            .getOrElse(throw new IllegalStateException(s"Submission missing after abolish: ${submission.id}"))
        }
        _ <- PlanSteps.read(
          AdminAuditTable.recordReview(
            connection = connection,
            targetType = AdminAuditTargetType.DirectorAbolish,
            submissionId = submission.id,
            reviewerId = user.id,
            decision = SubmissionStatus.Abolished.value,
            reviewNote = abolishNote,
            reviewedAt = timestamp
          )
        )
      } yield result
    }
}
