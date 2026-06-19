package microservice.user.tables.user

import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole

/** 用户表存储层行模型（PostgreSQL users 表列对齐）。
  *
  * 定义：id/username/displayName/role/adminLevel/时间戳 七字段 case class。
  * 问题：API 不宜直接暴露 SQL 列布局与 snake_case 命名。
  * 作用：UserTable CRUD 的边界类型；adminLevel 仅 role=admin 时有值。
  * 关联：[[UserRowMapper.toBackendUser]] → [[BackendUser]]；[[UserTableCodec]] JDBC 映射。
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
