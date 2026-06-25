package microservice.system.objects.enums

/** 审核审计 targetType 常量（跨模块共享，写入 admin.audit_logs）。 */
object AuditTargetType {
  val LevelSubmission: String = "level_submission"
  val BirdSubmission: String = "bird_submission"
  val DirectorAbolish: String = "director_abolish"
}
