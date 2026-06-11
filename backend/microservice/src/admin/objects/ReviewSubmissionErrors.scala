package microservice.admin.objects

import microservice.infrastructure.http.HttpError
import microservice.system.objects.SubmissionStatus

/** 关卡投稿审核 API 的业务错误类型。 */
sealed trait AdminReviewApiError {
  def toHttpError: HttpError
}

object ReviewSubmissionErrors {
  /** 投稿 ID 不存在 → 404 SUBMISSION_NOT_FOUND */
  final case class SubmissionMissing(submissionId: String) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId")
  }

  /** 投稿已非 PendingReview 状态，不可重复审核 → 409 INVALID_SUBMISSION_STATUS */
  final case class SubmissionAlreadyReviewed(submissionId: String) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("INVALID_SUBMISSION_STATUS", s"Submission already reviewed: $submissionId")
  }

  /** 投稿关联的 Level 记录缺失（数据不一致）→ 404 LEVEL_NOT_FOUND */
  final case class LinkedLevelMissing(levelId: String) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Linked level not found: $levelId")
  }

  /** 审核状态不是 Approved/Rejected → 400 INVALID_REVIEW_STATUS */
  final case class InvalidReviewStatus(status: SubmissionStatus) extends AdminReviewApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("INVALID_REVIEW_STATUS", s"Review status must be approved or rejected, got ${status.value}")
  }
}
