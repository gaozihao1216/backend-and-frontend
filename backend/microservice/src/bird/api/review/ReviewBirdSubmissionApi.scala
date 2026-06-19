package microservice.bird.api.review

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.submission.ReviewedBirdSubmission
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.shared.BirdRowMapper
import microservice.bird.tables.submission.BirdSubmissionTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

/** 审核鸟类设计投稿 APIMessage：通过或拒绝，并同步更新关联 BirdDesign 状态。 */
final case class ReviewBirdSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewBirdSubmissionBody
) extends APIWithTokenMessage[ReviewedBirdSubmission] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员对 PendingReview 鸟投稿做出 Approved/Rejected 决策，
    * 写入审核元数据，并将 BirdDesign 同步为 Published 或 Rejected。
    *
    * 解决了什么问题：自定义鸟种上线需人工审核，投稿与设计状态须原子一致。
    * 在事务内起到什么作用：先 updateReview(BirdSubmission)，再 updateReviewStatus(BirdDesign)；失败则回滚。
    * 关联的 HTTP 路由/前端 API：POST /admin/bird-submissions/:submissionId/review。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ReviewedBirdSubmission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Standard 管理员权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        // 步骤 2：加载投稿；不存在则 BIRD_SUBMISSION_NOT_FOUND
        submission <- PlanSteps.require(
          BirdSubmissionTable.findById(connection, submissionId) match {
            case None    => Left(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
            case Some(s) => Right(s)
          }
        )
        // 步骤 3：校验投稿仍为 PendingReview，且 body.status 为 Approved/Rejected
        _ <- PlanSteps.require(
          if (submission.status != SubmissionStatus.PendingReview) {
            Left(HttpError.conflict("SUBMISSION_ALREADY_REVIEWED", s"Submission already reviewed: $submissionId"))
          } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
            Left(HttpError.badRequest("INVALID_REVIEW_STATUS", "Review status must be approved or rejected"))
          } else {
            Right(())
          }
        )
        timestamp = Instant.now().toString
        // 步骤 4：更新投稿审核字段
        reviewed <- PlanSteps.require(
          BirdSubmissionTable
            .updateReview(
              connection = connection,
              submissionId = submissionId,
              status = body.status,
              reviewerId = userId,
              reviewNote = body.reviewNote,
              reviewedAt = timestamp
            )
            .toRight(HttpError.notFound("BIRD_SUBMISSION_NOT_FOUND", s"Bird submission not found: $submissionId"))
        )
        targetStatus =
          if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
        publishedAt = if (body.status == SubmissionStatus.Approved) Some(timestamp) else None
        rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote
        // 步骤 5：同步更新关联 BirdDesign 的 status/rejectionReason/publishedAt
        _ <- PlanSteps.require(
          BirdDesignTable
            .updateReviewStatus(
              connection = connection,
              designId = submission.birdDesignId,
              status = targetStatus,
              rejectionReason = rejectionReason,
              publishedAt = publishedAt,
              updatedAt = timestamp
            )
            .toRight(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: ${submission.birdDesignId}"))
            .map(_ => ())
        )
      // 返回审核后的鸟类投稿 DTO
      } yield ReviewedBirdSubmission.fromSubmission(BirdRowMapper.toBirdSubmission(reviewed))
    }
}
