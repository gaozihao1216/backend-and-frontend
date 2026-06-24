package microservice.level.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.support.design.LevelDesignAccess
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.submission.Submission
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.SubmissionRow
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.{LevelStatus, SubmissionStatus, UserRole}
import microservice.level.body.design.SubmitLevelBody

/** 设计师提交关卡审核 APIMessage。 */
final case class SubmitLevelAPIMessage(
  designerId: String,
  body: SubmitLevelBody
) extends APIWithTokenMessage[Submission] {
  override def token: String = designerId

  /** plan 定义了什么业务流程：Designer 将 Draft/Rejected 关卡提交审核，创建 Submission 记录。
    *
    * 关联的前端 API：POST /designer/submissions；前端 `SubmitLevelApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Designer
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：加载关卡并确认处于可提交状态
        level <- LevelDesignAccess.requireLevel(connection, body.levelId)
        // 步骤 3：校验作者身份与关卡状态允许提交
        _ <- LevelDesignAccess.requireSubmittable(connection, designerId, level)
        // 步骤 4：更新 Level 为 PendingReview 并插入 SubmissionRow
        submission <- PlanSteps.read {
          val timestamp = Instant.now().toString
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
      } yield submission
    }
}
