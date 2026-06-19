package microservice.level.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.submission.Submission
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{SubmissionRow}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.{LevelStatus, SubmissionStatus}
import microservice.system.objects.UserRole

/** 设计师提交关卡审核 APIMessage。 */
final case class SubmitLevelAPIMessage(
  designerId: String,
  body: SubmitLevelBody
) extends APIWithTokenMessage[Submission] {
  override def token: String = designerId

  /** plan 定义了什么业务流程：Designer 将 Draft/Rejected 关卡提交审核，创建 Submission 并置 Level 为 PendingReview。
    *
    * 解决了什么问题：UGC 关卡上线需经 submit → admin review 流程。
    * 在事务内起到什么作用：校验通过后双写 Level.status 与 SubmissionRow；失败则回滚。
    * 关联的 HTTP 路由/前端 API：POST /designer/submissions；前端 `SubmitLevelApi`。
    */

  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        // 步骤 2：执行业务步骤
        level <- PlanSteps.require(
          LevelTable.findById(connection, body.levelId) match {
            case None =>
              Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: ${body.levelId}"))
            case Some(value) =>
              Right(value)
          }
        )
        // 步骤 3：执行业务步骤
        _ <- PlanSteps.require(
          // 只能提交自己的关卡
          if (level.authorId != designerId) {
            Left(HttpError.forbidden("Cannot submit another designer's level"))
          // 同一关卡不允许存在多条 pending submission
          } else if (SubmissionTable.hasPendingForLevel(connection, body.levelId)) {
            Left(HttpError.conflict("SUBMISSION_EXISTS", "Level already has a pending submission"))
          // 仅 Draft 或 Rejected 状态可再次提交
          } else if (level.status != LevelStatus.Draft && level.status != LevelStatus.Rejected) {
            Left(HttpError.conflict("INVALID_LEVEL_STATUS", "Level cannot be submitted in current status"))
          } else {
            Right(())
          }
        )
        // 步骤 4：读取并组装数据
        submission <- PlanSteps.read {
          val timestamp = Instant.now().toString
          // 关卡与 submission 双写：level.status 与 submission.status 保持同步
          LevelTable.updateSubmissionStatus(connection, body.levelId, LevelStatus.PendingReview, None, timestamp)
          val row = SubmissionTable.insert(
            connection,
            SubmissionRow(
              id = SubmissionTable.nextId(connection),
              levelId = body.levelId,
              submitterId = designerId,
              status = SubmissionStatus.PendingReview,
              reviewerId = None,
              reviewNote = None,
              submittedAt = timestamp,
              reviewedAt = None
            )
          )
          LevelRowMapper.toSubmission(row)
        }
      // 返回业务结果 DTO/领域对象
      } yield submission
    }
}
