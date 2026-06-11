package microservice.user.tables.user

import microservice.user.objects.BackendUser

/** UserRow ↔ BackendUser 的映射层，隔离存储字段与 API 对象。 */
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
