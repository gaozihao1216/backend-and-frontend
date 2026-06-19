package microservice.admin.objects.director.level_assignment

import microservice.infrastructure.http.HttpError

/** 总监关卡槽位分配相关 API 的业务错误集合；各 case 提供 toHttpError 映射 HTTP 状态与错误码。 */
object AssignLevelSlotErrors {
  /** 槽位后缀不在 LevelSlotCatalog 支持列表内 → 400 INVALID_LEVEL_SUFFIX */
  final case class InvalidLevelSuffix(levelSuffix: String) {
    def toHttpError: HttpError =
      HttpError.badRequest("INVALID_LEVEL_SUFFIX", s"Unsupported level suffix: $levelSuffix")
  }

  /** 投稿不存在 → 404 SUBMISSION_NOT_FOUND */
  final case class SubmissionMissing(submissionId: String) {
    def toHttpError: HttpError =
      HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId")
  }

  /** 仅 Approved 状态的投稿可分配到槽位 → 400 SUBMISSION_NOT_APPROVED */
  final case class SubmissionNotApproved(submissionId: String) {
    def toHttpError: HttpError =
      HttpError.badRequest("SUBMISSION_NOT_APPROVED", s"Only approved submissions can be assigned: $submissionId")
  }

  /** 仅 Approved 状态的投稿可被总监废止 → 400 SUBMISSION_NOT_ABOLISHABLE */
  final case class SubmissionNotAbolishable(submissionId: String) {
    def toHttpError: HttpError =
      HttpError.badRequest("SUBMISSION_NOT_ABOLISHABLE", s"Only approved submissions can be abolished: $submissionId")
  }

  /** 投稿关联 Level 缺失 → 404 LEVEL_NOT_FOUND */
  final case class LinkedLevelMissing(levelId: String) {
    def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Linked level not found: $levelId")
  }

  /** 指定槽位尚无分配记录 → 404 LEVEL_ASSIGNMENT_NOT_FOUND */
  final case class AssignmentMissing(levelSuffix: String) {
    def toHttpError: HttpError =
      HttpError.notFound("LEVEL_ASSIGNMENT_NOT_FOUND", s"No assignment found for slot: $levelSuffix")
  }
}
