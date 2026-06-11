package microservice.admin.tables

/** 管理员审核审计行模型（预留结构，尚未接入持久化表）。
  *
  * 用途：记录关卡/鸟类投稿审核决策，便于后续扩展 audit log 或合规追溯。
  * 字段：submissionId 关联投稿、reviewerId 审核人、decision 决策值、reviewNote 备注、reviewedAt 时间戳。
  * 关联：ReviewSubmissionAPIMessage、ReviewBirdSubmissionAPIMessage 的审核结果可映射为此结构。
  */
final case class ReviewAuditRow(
  submissionId: String,
  reviewerId: String,
  decision: String,
  reviewNote: Option[String],
  reviewedAt: String
)
