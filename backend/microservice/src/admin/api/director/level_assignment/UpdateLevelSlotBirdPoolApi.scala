package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.system.objects.AdminLevel
import microservice.admin.api.director.level_assignment.body.UpdateLevelSlotBirdPoolBody

/** PUT /admin/director/level-assignments/:levelSuffix/bird-pool — 更新槽位 bird pool。 */
final case class UpdateLevelSlotBirdPoolAPIMessage(
  userId: String,
  levelSuffix: String,
  body: UpdateLevelSlotBirdPoolBody
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- DirectorLevelAssignmentSupport.requireSupportedSuffix(levelSuffix)
        existing <- DirectorLevelAssignmentSupport.requireAssignmentForSuffix(connection, levelSuffix)
        detail <- PlanSteps.read {
          val updated = existing.copy(birdPool = Some(body.birdPool))
          LevelSlotAssignmentTable.upsert(connection, updated)
          val submissionWithLevel =
            DirectorLevelAssignmentSupport
              .submissionWithLevel(connection, updated.submissionId)
              .getOrElse(
                throw new IllegalStateException(s"Submission level missing after bird pool update: ${updated.submissionId}")
              )
          LevelSlotAssignmentDetail(LevelSlotAssignment.from(updated), submissionWithLevel)
        }
      } yield detail
    }
}
