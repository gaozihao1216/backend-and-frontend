error id: file://wsl.localhost/Ubuntu/home/gaozihao/qianhouduan/backend-and-frontend/backend/microservice/src/admin/support/director/level_assignment/DirectorLevelAssignmentSupport.scala:
file://wsl.localhost/Ubuntu/home/gaozihao/qianhouduan/backend-and-frontend/backend/microservice/src/admin/support/director/level_assignment/DirectorLevelAssignmentSupport.scala
empty definition using pc, found symbol in pc: 
empty definition using semanticdb
empty definition using fallback
non-local guesses:
	 -cats/implicits.
	 -cats/implicits#
	 -cats/implicits().
	 -scala/Predef.
	 -scala/Predef#
	 -scala/Predef().
offset: 2070
uri: file://wsl.localhost/Ubuntu/home/gaozihao/qianhouduan/backend-and-frontend/backend/microservice/src/admin/support/director/level_assignment/DirectorLevelAssignmentSupport.scala
text:
```scala
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
  /** plan 中使用的校验版本：失败时直接短路为 HttpError。 */
  def requireSupportedSuffix(levelSuffix: String): Step[Unit] =
    if (LevelSlotCatalog.isSupported(levelSuffix)) {
      PlanStep.succeed(())
    } else {
      PlanStep.fail(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
    }

  /** 纯 Either 版本，供不在 PlanStep 链中的调用方复用。 */
  def checkSupportedSuffix(levelSuffix: String): Either[HttpError, Unit] =
    if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
    else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)

  /** 汇总槽位、已批准投稿和鸟池选项，生成总监分配看板。 */
  def buildBoardStep(connection: Connection): Step[DirectorLevelAssignmentBoard] =
    for {
      slots <- PlanSteps.runApi(ListSlotAssignmentsInternalAPIMessage(), connection)
      assignedSubmissionIds = slots.map(_.s@@ubmissionId).toSet
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

```


#### Short summary: 

empty definition using pc, found symbol in pc: 