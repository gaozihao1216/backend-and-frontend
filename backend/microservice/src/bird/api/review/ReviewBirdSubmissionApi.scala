package microservice.bird.api.review

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.support.AccessControl
import microservice.admin.api.internal.RecordReviewAuditInternalAPIMessage
import microservice.bird.objects.submission.ReviewedBirdSubmission
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.submission.{BirdSubmissionRow, BirdSubmissionTable}
import microservice.infrastructure.api.{APIWithTokenMessage, PlanStep, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.{AdminLevel, AuditTargetType, LevelStatus, SubmissionStatus}
import microservice.bird.objects.submission.request.ReviewBirdSubmissionRequest

/** 审核鸟类设计投稿 APIMessage：通过或拒绝，并同步更新关联 BirdDesign 状态。 */
final case class ReviewBirdSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewBirdSubmissionRequest
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
        submission <- requirePendingSubmission(connection)
        // 步骤 3：校验审核决策（通过/拒绝）与 reviewNote 合法性
        _ <- requireReviewDecision(submission)
        timestamp = Instant.now().toString
        // 步骤 4：更新 BirdSubmission 审核字段
        reviewed <- requireUpdatedSubmission(connection, timestamp)
        // 步骤 5：同步关联 BirdDesign 的 submissionStatus
        _ <- requireSyncedDesign(connection, submission, timestamp)
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

  private def requirePendingSubmission(connection: Connection): PlanStep.Step[BirdSubmissionRow] =
    EitherT.liftF(IO(BirdSubmissionTable.findById(connection, submissionId))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
      case Some(row) =>
        EitherT.rightT(row)
    }

  private def requireReviewDecision(submission: BirdSubmissionRow): PlanStep.Step[Unit] =
    if (submission.status != SubmissionStatus.PendingReview) {
      PlanStep.fail(HttpError.conflict("SUBMISSION_ALREADY_REVIEWED", s"Submission already reviewed: ${submission.id}"))
    } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
      PlanStep.fail(HttpError.badRequest("INVALID_REVIEW_STATUS", "Review status must be approved or rejected"))
    } else {
      PlanStep.succeed(())
    }

  private def requireUpdatedSubmission(connection: Connection, reviewedAt: String): PlanStep.Step[BirdSubmissionRow] =
    EitherT.liftF(
      IO(
        BirdSubmissionTable.updateReview(
          connection = connection,
          submissionId = submissionId,
          status = body.status,
          reviewerId = userId,
          reviewNote = body.reviewNote,
          reviewedAt = reviewedAt
        )
      )
    ).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
      case Some(row) =>
        EitherT.rightT(row)
    }

  private def requireSyncedDesign(
    connection: Connection,
    submission: BirdSubmissionRow,
    updatedAt: String
  ): PlanStep.Step[Unit] = {
    val targetStatus =
      if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
    val publishedAt = if (body.status == SubmissionStatus.Approved) Some(updatedAt) else None
    val rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote

    EitherT.liftF(
      IO(
        BirdDesignTable.updateReviewStatus(
          connection = connection,
          designId = submission.birdDesignId,
          status = targetStatus,
          rejectionReason = rejectionReason,
          publishedAt = publishedAt,
          updatedAt = updatedAt
        )
      )
    ).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: ${submission.birdDesignId}"))
      case Some(_) =>
        EitherT.rightT(())
    }
  }
}
