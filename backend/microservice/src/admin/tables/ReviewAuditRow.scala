package microservice.admin.tables

/** 管理员审核审计行：append-only 记录每次投稿审核或总监废止决策。
  *
  * 字段：targetType 区分关卡/鸟类投稿或总监废止；decision 为 SubmissionStatus.value 字符串。
  * 关联：[[AdminAuditTable]]；映射为 [[microservice.admin.objects.submission.ReviewAudit]]。
  */
final case class ReviewAuditRow(
  id: String,
  targetType: String,
  submissionId: String,
  reviewerId: String,
  decision: String,
  reviewNote: Option[String],
  reviewedAt: String
)
