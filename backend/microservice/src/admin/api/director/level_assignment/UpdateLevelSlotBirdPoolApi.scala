package microservice.admin.api.director.level_assignment

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignment
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.assignment.UpdateSlotBirdPoolInternalAPIMessage
import microservice.level.api.internal.admin.submissions.GetSubmissionWithLevelInternalAPIMessage
import microservice.system.objects.enums.AdminLevel
import microservice.admin.objects.director.level_assignment.request.UpdateLevelSlotBirdPoolRequest

/** PUT /admin/director/level-assignments/:levelSuffix/bird-pool — 更新槽位 bird pool。 */
final case class UpdateLevelSlotBirdPoolAPIMessage(
  userId: String,
  levelSuffix: String,
  body: UpdateLevelSlotBirdPoolRequest
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- EitherT(DirectorLevelAssignmentSupport.requireSupportedSuffix(levelSuffix))
        slot <- PlanSteps.runApi(
          UpdateSlotBirdPoolInternalAPIMessage(
            levelSuffix,
            LevelHandoffMapping.toLevelBirdPool(body.birdPool)
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
