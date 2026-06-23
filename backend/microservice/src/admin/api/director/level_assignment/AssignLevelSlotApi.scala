package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.inventory.BirdPool
import microservice.level.tables.shared.LevelSlotAssignmentRow
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.system.objects.AdminLevel
import microservice.admin.api.director.level_assignment.body.AssignLevelSlotBody

/** POST /admin/director/level-assignments/:levelSuffix — 将已批准投稿分配到槽位。 */
final case class AssignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String,
  body: AssignLevelSlotBody
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        user <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        _ <- DirectorLevelAssignmentSupport.requireSupportedSuffix(levelSuffix)
        submission <- DirectorLevelAssignmentSupport.requireApprovedSubmission(connection, body.submissionId)
        _ <- DirectorLevelAssignmentSupport.requireLinkedLevel(connection, submission.levelId)
        detail <- PlanSteps.read {
          val timestamp = java.time.Instant.now().toString
          val row = LevelSlotAssignmentRow(
            id = LevelSlotAssignmentTable.nextId(connection),
            levelSuffix = levelSuffix,
            submissionId = submission.id,
            sourceLevelId = submission.levelId,
            assignedById = user.id,
            assignedAt = timestamp,
            note = body.note,
            birdPool = Some(body.birdPool.getOrElse(BirdPool.default))
          )
          LevelSlotAssignmentTable.upsert(connection, row)
          val submissionWithLevel =
            DirectorLevelAssignmentSupport
              .submissionWithLevel(connection, submission.id)
              .getOrElse(
                throw new IllegalStateException(s"Submission level missing after assign: ${submission.id}")
              )
          LevelSlotAssignmentDetail(LevelSlotAssignment.from(row), submissionWithLevel)
        }
      } yield detail
    }
}
