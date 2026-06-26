package microservice.admin.api.director.level_assignment

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.objects.level.AdminBirdPool
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.admin.support.mapping.LevelHandoffMapping
import microservice.user.support.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.api.internal.admin.assignment.AssignSlotInternalAPIMessage
import microservice.level.api.internal.admin.submissions.GetSubmissionWithLevelInternalAPIMessage
import microservice.system.objects.enums.AdminLevel
import microservice.admin.objects.director.level_assignment.request.AssignLevelSlotRequest

/** POST /admin/director/level-assignments/:levelSuffix — 将已批准投稿分配到槽位。 */
final case class AssignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String,
  body: AssignLevelSlotRequest
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  /** 总监分配关卡槽位的主流程。
    *
    * 这里不直接操作 level 表，而是通过 level 模块 internal API 完成槽位写入，
    * admin 模块只负责总监权限、请求校验和跨模块响应对象组装。
    */
  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        user <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        _ <- EitherT(DirectorLevelAssignmentSupport.requireSupportedSuffix(levelSuffix))
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
