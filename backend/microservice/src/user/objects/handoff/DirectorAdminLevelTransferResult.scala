package microservice.user.objects.handoff

/** 总监权限移交结果 handoff DTO（user → admin internal API）。 */
final case class DirectorAdminLevelTransferResult(
  fromUserId: String,
  toUserId: String
)
