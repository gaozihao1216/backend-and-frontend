package microservice.user.tables.user

import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole

/** 用户表在存储层的行模型（与 PostgreSQL users 表列一一对应）。
  *
  * 不直接作为 API 响应；对外使用 objects.BackendUser，经 UserRowMapper 转换。
  */
final case class UserRow(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  adminLevel: Option[AdminLevel], // role!=admin 时应为 None
  createdAt: String,
  updatedAt: String
)
