package microservice.auth.tables

import microservice.system.objects.UserRole
import java.sql.{ResultSet, SQLException}

private[tables] object UserTableCodec {
  val baseSelect: String =
    """
      SELECT id, username, display_name, role, created_at, updated_at
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
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )
}
