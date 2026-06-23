package microservice.user.objects.handoff

/** 用户展示摘要 handoff DTO（供 player 等模块 internal API 消费）。 */
final case class UserDisplaySummary(
  userId: String,
  displayName: String
)
