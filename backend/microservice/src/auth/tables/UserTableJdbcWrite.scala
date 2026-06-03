package microservice.auth.tables

import java.sql.Connection

private[tables] object UserTableJdbcWrite {
  def insert(connection: Connection, row: UserRow): UserRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO users (id, username, display_name, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.username)
      statement.setString(3, row.displayName)
      statement.setString(4, row.role.value)
      statement.setString(5, row.createdAt)
      statement.setString(6, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
