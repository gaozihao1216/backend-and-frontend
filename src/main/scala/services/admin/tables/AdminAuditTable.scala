package coursebackend.services.admin.tables

final case class ReviewAuditRow(
  submissionId: String,
  reviewerId: String,
  decision: String,
  reviewNote: Option[String],
  reviewedAt: String
)
