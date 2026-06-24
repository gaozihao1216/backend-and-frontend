package microservice.bird.api.review

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.support.AccessControl
import microservice.admin.api.internal.RecordReviewAuditInternalAPIMessage
import microservice.bird.objects.submission.ReviewedBirdSubmission
import microservice.bird.support.review.BirdSubmissionReviewSupport
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, AuditTargetType}
import microservice.bird.body.review.ReviewBirdSubmissionBody

/** 审核鸟类设计投稿 APIMessage：通过或拒绝，并同步更新关联 BirdDesign 状态。 */
final case class ReviewBirdSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewBirdSubmissionBody
) extends APIWithTokenMessage[ReviewedBirdSubmission] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员审核鸟类设计投稿（通过/拒绝），同步 BirdDesign 状态并记录审计。
    *
    * 关联的前端 API：POST /admin/bird-submissions/:submissionId/review；前端 `ReviewBirdSubmissionApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ReviewedBirdSubmission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Standard 及以上管理员
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ())
        // 步骤 2：确认鸟类投稿处于待审状态
        submission <- BirdSubmissionReviewSupport.requirePendingSubmission(connection, submissionId)
        // 步骤 3：校验审核决策（通过/拒绝）与 reviewNote 合法性
        _ <- BirdSubmissionReviewSupport.requireReviewDecision(submission, body)
        timestamp = Instant.now().toString
        // 步骤 4：更新 BirdSubmission 审核字段
        reviewed <- BirdSubmissionReviewSupport.requireUpdatedSubmission(
          connection,
          submissionId,
          body,
          userId,
          timestamp
        )
        // 步骤 5：同步关联 BirdDesign 的 submissionStatus
        _ <- BirdSubmissionReviewSupport.requireSyncedDesign(connection, submission, body, timestamp)
        // 步骤 6：写入 AdminAuditTable 审核审计记录
        _ <- PlanSteps.runApi(
          RecordReviewAuditInternalAPIMessage(
            targetType = AuditTargetType.BirdSubmission,
            submissionId = submissionId,
            reviewerId = userId,
            decision = body.status.value,
            reviewNote = body.reviewNote,
            reviewedAt = timestamp
          ),
          connection
        )
      } yield ReviewedBirdSubmission.fromSubmission(BirdSubmissionTable.toBirdSubmission(reviewed))
    }
}
