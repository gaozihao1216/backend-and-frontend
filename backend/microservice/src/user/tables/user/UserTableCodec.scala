package microservice.user.tables.user

import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole
import java.sql.{ResultSet, SQLException}

/** JDBC 读路径专用：SQL 列名 ↔ UserRow 的编解码。 */
private[tables] object UserTableCodec {

  /** 所有 SELECT 复用的基础语句（ snake_case 列名对应 PostgreSQL 表结构）。 */
  val baseSelect: String =
    """
      SELECT id, username, display_name, role, admin_level, created_at, updated_at
      FROM users
    """

  /** 从 ResultSet 当前行构造 UserRow；非法 enum 值抛 SQLException 触发事务 rollback。 */
  def rowFromResultSet(resultSet: ResultSet): UserRow =
    UserRow(
      id = resultSet.getString("id"),
      username = resultSet.getString("username"),
      displayName = resultSet.getString("display_name"),
      role = UserRole.fromString(resultSet.getString("role")).getOrElse(
        throw new SQLException(s"Unknown user role: ${resultSet.getString("role")}")
      ),
      adminLevel = Option(resultSet.getString("admin_level")).map(value =>
        AdminLevel.fromString(value).getOrElse(
          throw new SQLException(s"Unknown admin level: $value")
        )
      ),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )
}
