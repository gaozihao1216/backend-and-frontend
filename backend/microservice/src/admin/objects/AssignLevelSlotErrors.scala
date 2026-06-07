package microservice.admin.objects

import microservice.infrastructure.http.HttpError

object AssignLevelSlotErrors {
  final case class InvalidLevelSuffix(levelSuffix: String) {
    def toHttpError: HttpError =
      HttpError.badRequest("INVALID_LEVEL_SUFFIX", s"Unsupported level suffix: $levelSuffix")
  }

  final case class SubmissionMissing(submissionId: String) {
    def toHttpError: HttpError =
      HttpError.notFound("SUBMISSION_NOT_FOUND", s"Submission not found: $submissionId")
  }

  final case class SubmissionNotApproved(submissionId: String) {
    def toHttpError: HttpError =
      HttpError.badRequest("SUBMISSION_NOT_APPROVED", s"Only approved submissions can be assigned: $submissionId")
  }

  final case class SubmissionNotAbolishable(submissionId: String) {
    def toHttpError: HttpError =
      HttpError.badRequest("SUBMISSION_NOT_ABOLISHABLE", s"Only approved submissions can be abolished: $submissionId")
  }

  final case class LinkedLevelMissing(levelId: String) {
    def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Linked level not found: $levelId")
  }

  final case class AssignmentMissing(levelSuffix: String) {
    def toHttpError: HttpError =
      HttpError.notFound("LEVEL_ASSIGNMENT_NOT_FOUND", s"No assignment found for slot: $levelSuffix")
  }
}
