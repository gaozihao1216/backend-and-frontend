package microservice.admin.api.submissions

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.tables.shared.LevelRowMapper
import microservice.admin.objects.submission.{ReviewedSubmission, ReviewSubmissionErrors}
import microservice.level.tables.level.LevelTable
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

/** 审核关卡投稿 APIMessage：通过或拒绝，并同步更新关联 Level 状态。 */
final case class ReviewSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewSubmissionBody
) extends APIWithTokenMessage[ReviewedSubmission] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Standard 管理员对 PendingReview 投稿做出 Approved/Rejected 决策，
    * 写入审核人/时间/备注，并将 Level 状态同步为 Published 或 Rejected。
    *
    * 解决了什么问题：关卡上线需经人工审核，且投稿与 Level 状态必须原子一致。
    * 在事务内起到什么作用：先更新 SubmissionTable，再更新 LevelTable；任一步失败则整笔回滚。
    * 关联的 HTTP 路由/前端 API：POST /admin/submissions/:submissionId/review；前端 `ReviewSubmissionApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ReviewedSubmission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Standard 管理员权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        // 步骤 2：按 submissionId 加载投稿；不存在则 SUBMISSION_NOT_FOUND
        submission <- PlanSteps.require(
          SubmissionTable.findById(connection, submissionId) match {
            case None    => Left(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
            case Some(s) => Right(s)
          }
        )
        // 步骤 3：校验投稿仍为 PendingReview，且 body.status 为 Approved/Rejected
        _ <- PlanSteps.require(
          if (submission.status != SubmissionStatus.PendingReview) {
            Left(ReviewSubmissionErrors.SubmissionAlreadyReviewed(submissionId).toHttpError)
          } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
            Left(ReviewSubmissionErrors.InvalidReviewStatus(body.status).toHttpError)
          } else {
            Right(())
          }
        )
        timestamp = Instant.now().toString
        // 步骤 4：更新投稿审核字段（status、reviewerId、reviewNote、reviewedAt）
        reviewed <- PlanSteps.require(
          SubmissionTable
            .updateReview(
              connection = connection,
              submissionId = submissionId,
              status = body.status,
              reviewerId = userId,
              reviewNote = body.reviewNote,
              reviewedAt = timestamp
            )
            .toRight(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
        )
        targetStatus =
          if (body.status == SubmissionStatus.Approved) LevelStatus.Published else LevelStatus.Rejected
        publishedAt = if (body.status == SubmissionStatus.Approved) Some(timestamp) else None
        rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote
        // 步骤 5：同步更新关联 Level 的 status/rejectionReason/publishedAt
        _ <- PlanSteps.require(
          LevelTable
            .updateReviewStatus(
              connection = connection,
              levelId = submission.levelId,
              status = targetStatus,
              rejectionReason = rejectionReason,
              publishedAt = publishedAt,
              updatedAt = timestamp
            )
            .toRight(ReviewSubmissionErrors.LinkedLevelMissing(submission.levelId).toHttpError)
            .map(_ => ())
        )
      // 返回审核后的投稿 DTO，status 为字符串便于 JSON 序列化
      } yield ReviewedSubmission.fromSubmission(LevelRowMapper.toSubmission(reviewed))
    }
}
