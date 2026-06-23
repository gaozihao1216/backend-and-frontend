package microservice.admin.support.director.level_assignment

import cats.implicits._
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.AssignLevelSlotErrors
import microservice.admin.objects.director.level_assignment.board.DirectorLevelAssignmentBoard
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.objects.director.level_assignment.LevelSlotCatalog
import microservice.admin.support.mapping.{BirdHandoffMapping, LevelHandoffMapping}
import microservice.bird.api.internal.admin.ListBirdPoolOptionsInternalAPIMessage
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.api.PlanSteps
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.{
  GetSubmissionWithLevelInternalAPIMessage,
  ListApprovedSubmissionsWithLevelInternalAPIMessage,
  ListSlotAssignmentsInternalAPIMessage
}

/** 总监关卡槽位分配辅助逻辑（admin 模块内编排）。 */
object DirectorLevelAssignmentSupport {
  def requireSupportedSuffix(levelSuffix: String): Step[Unit] =
    if (LevelSlotCatalog.isSupported(levelSuffix)) {
      PlanStep.succeed(())
    } else {
      PlanStep.fail(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
    }

  def checkSupportedSuffix(levelSuffix: String): Either[HttpError, Unit] =
    if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
    else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)

  def buildBoardStep(connection: Connection): Step[DirectorLevelAssignmentBoard] =
    for {
      slots <- PlanSteps.runApi(ListSlotAssignmentsInternalAPIMessage(), connection)
      assignedSubmissionIds = slots.map(_.submissionId).toSet
      pending <- PlanSteps.runApi(
        ListApprovedSubmissionsWithLevelInternalAPIMessage(assignedSubmissionIds),
        connection
      )
      assignments <- slots.traverse { slot =>
        PlanSteps
          .runApi(GetSubmissionWithLevelInternalAPIMessage(slot.submissionId), connection)
          .map { submission =>
            LevelSlotAssignmentDetail(
              LevelHandoffMapping.toSlotAssignment(slot),
              LevelHandoffMapping.toSubmissionWithLevel(submission)
            )
          }
      }
      birdPoolOptions <- PlanSteps.runApi(ListBirdPoolOptionsInternalAPIMessage(), connection)
    } yield DirectorLevelAssignmentBoard(
      assignments = assignments,
      pendingApproved = pending.map(LevelHandoffMapping.toSubmissionWithLevel),
      birdPoolOptions = birdPoolOptions.map(BirdHandoffMapping.toDirectorBirdPoolOption)
    )
}
