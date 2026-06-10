package microservice.user.tables.user

import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole
import java.sql.{ResultSet, SQLException}

private[tables] object UserTableCodec {
  val baseSelect: String =
    """
      SELECT id, username, display_name, role, admin_level, created_at, updated_at
      FROM users
    """

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
