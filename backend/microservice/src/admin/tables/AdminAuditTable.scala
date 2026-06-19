package microservice.admin.tables

/** 管理员审核审计行模型（预留结构，尚未接入 inmemory/jdbc 持久化表）。
  *
  * 表职责：记录关卡/鸟类投稿审核决策，便于后续扩展 audit log 或合规追溯。
  * Row↔Object：当前仅为 Row 结构；未来可映射为 ReviewAudit 领域对象。
  * 双实现说明：尚无 Table 实现；ReviewSubmissionAPIMessage 等审核结果可映射为此 Row。
  * 字段：submissionId 关联投稿；reviewerId 审核人；decision 决策值；reviewNote 备注；reviewedAt 时间戳。
  */
final case class ReviewAuditRow(
  submissionId: String,
  reviewerId: String,
  decision: String,
  reviewNote: Option[String],
  reviewedAt: String
)
