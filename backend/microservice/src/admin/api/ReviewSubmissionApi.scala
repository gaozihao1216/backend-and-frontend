package microservice.admin.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.auth.tables.user.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.level.tables.shared.LevelRowMapper
import microservice.admin.objects.{ReviewedSubmission, ReviewSubmissionErrors}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.LevelStatus
import microservice.system.objects.SubmissionStatus
import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class ReviewSubmissionBody(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

object ReviewSubmissionBody {
  implicit val encoder: Encoder[ReviewSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[ReviewSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewSubmissionBody] = jsonOf
}

final case class ReviewSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: ReviewSubmissionBody
) extends APIWithTokenMessage[ReviewedSubmission] {
  override def token: String = userId

  /** 管理员审核关卡投稿，并联动更新 Level 状态。
    *
    * 实现：
    *   1. 校验 admin 角色且 submission 为 PendingReview
    *   2. 更新 SubmissionTable 审核字段
    *   3. 批准 → LevelStatus.Published；拒绝 → Rejected + rejectionReason
    * 关联：前端 AdminPage /admin/proposals；玩家仅能看到 Published 关卡。
    */
  override def plan(connection: Connection): IO[Either[HttpError, ReviewedSubmission]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          SubmissionTable.findById(connection, submissionId) match {
            case None =>
              Left(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
            case Some(submission) =>
              if (submission.status != SubmissionStatus.PendingReview) {
                Left(ReviewSubmissionErrors.SubmissionAlreadyReviewed(submissionId).toHttpError)
              } else if (body.status != SubmissionStatus.Approved && body.status != SubmissionStatus.Rejected) {
                Left(ReviewSubmissionErrors.InvalidReviewStatus(body.status).toHttpError)
              } else {
                val timestamp = Instant.now().toString
                val reviewed = SubmissionTable.updateReview(
                  connection = connection,
                  submissionId = submissionId,
                  status = body.status,
                  reviewerId = userId,
                  reviewNote = body.reviewNote,
                  reviewedAt = timestamp
                )

                reviewed match {
                  case None =>
                    Left(ReviewSubmissionErrors.SubmissionMissing(submissionId).toHttpError)
                  case Some(reviewedSubmission) =>
                    // submission 与 level 状态联动：审核结果决定关卡是否对外可见
                    val targetStatus =
                      if (body.status == SubmissionStatus.Approved) {
                        LevelStatus.Published
                      } else {
                        LevelStatus.Rejected
                      }
                    val publishedAt = if (body.status == SubmissionStatus.Approved) Some(timestamp) else None
                    val rejectionReason = if (body.status == SubmissionStatus.Approved) None else body.reviewNote

                    LevelTable.updateReviewStatus(
                      connection = connection,
                      levelId = submission.levelId,
                      status = targetStatus,
                      rejectionReason = rejectionReason,
                      publishedAt = publishedAt,
                      updatedAt = timestamp
                    ) match {
                      case None =>
                        Left(ReviewSubmissionErrors.LinkedLevelMissing(submission.levelId).toHttpError)
                      case Some(_) =>
                        Right(ReviewedSubmission.fromSubmission(LevelRowMapper.toSubmission(reviewedSubmission)))
                    }
                }
              }
          }
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}
