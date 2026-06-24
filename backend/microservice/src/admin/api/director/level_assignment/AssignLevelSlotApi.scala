package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.objects.level.AdminBirdPool
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.{AssignSlotInternalAPIMessage, GetSubmissionWithLevelInternalAPIMessage}
import microservice.system.objects.AdminLevel
import microservice.admin.body.director.level_assignment.AssignLevelSlotBody

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
        slot <- PlanSteps.runApi(
          AssignSlotInternalAPIMessage(
            levelSuffix = levelSuffix,
            submissionId = body.submissionId,
            assignedById = user.id,
            note = body.note,
            birdPool = body.birdPool
              .map(LevelHandoffMapping.toLevelBirdPool)
              .getOrElse(LevelHandoffMapping.toLevelBirdPool(AdminBirdPool.default))
          ),
          connection
        )
        submissionWithLevel <- PlanSteps.runApi(
          GetSubmissionWithLevelInternalAPIMessage(slot.submissionId),
          connection
        )
      } yield LevelSlotAssignmentDetail(
        LevelHandoffMapping.toSlotAssignment(slot),
        LevelHandoffMapping.toSubmissionWithLevel(submissionWithLevel)
      )
    }
}
