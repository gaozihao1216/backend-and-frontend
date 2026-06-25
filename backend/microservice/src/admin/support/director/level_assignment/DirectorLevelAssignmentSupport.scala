package microservice.admin.support.director.level_assignment

import cats.implicits._
import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.AssignLevelSlotErrors
import microservice.admin.objects.director.level_assignment.board.DirectorLevelAssignmentBoard
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.objects.director.level_assignment.LevelSlotCatalog
import microservice.admin.support.mapping.{BirdHandoffMapping, LevelHandoffMapping}
import microservice.bird.api.internal.admin.ListBirdPoolOptionsInternalAPIMessage
import microservice.infrastructure.api.PlanSteps
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.assignment.ListSlotAssignmentsInternalAPIMessage
import microservice.level.api.internal.admin.submissions.{
  GetSubmissionWithLevelInternalAPIMessage,
  ListApprovedSubmissionsWithLevelInternalAPIMessage
}

/** 总监关卡槽位分配辅助逻辑（admin 模块内编排）。
  *
  * 该对象放在 support 中，是因为它服务多个 director API：
  * 槽位后缀校验、分配看板构建和跨模块对象转换都属于同一组业务编排。
  */
private[admin] object DirectorLevelAssignmentSupport {
  /** 校验槽位后缀是否合法；support 对外统一返回 IO[Either]，不暴露 PlanStep 类型。 */
  def requireSupportedSuffix(levelSuffix: String): IO[Either[HttpError, Unit]] =
    IO.pure {
      if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
      else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
    }

  /** 汇总槽位、已批准投稿和鸟池选项，生成总监分配看板。 */
  def buildBoard(connection: Connection): IO[Either[HttpError, DirectorLevelAssignmentBoard]] =
    PlanSteps.finish {
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
}
