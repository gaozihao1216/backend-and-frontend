package microservice.user.tables.user

import microservice.user.objects.BackendUser

/** UserRow ↔ BackendUser 映射层。
  *
  * 定义：toBackendUser 纯函数，字段一一拷贝。
  * 问题：隔离存储 Row 与 API 对象，避免 Table 层依赖 Circe JSON。
  * 作用：bind/profile/backend-users 响应统一经此转换。
  * 关联：[[BackendUser]]、[[UserRow]]；各 user APIMessage PlanSteps.read。
  */
object UserRowMapper {

  /** 将数据库/InMemory 行转为 API 层 BackendUser（字段一一对应，无额外业务逻辑）。 */
  def toBackendUser(row: UserRow): BackendUser =
    BackendUser(
      row.id,
      row.username,
      row.displayName,
      row.role,
      row.adminLevel,
      row.createdAt,
      row.updatedAt
    )
}
