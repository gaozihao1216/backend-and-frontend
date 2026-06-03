package microservice.auth.tables

import microservice.system.objects.UserRole
import java.sql.Connection

private[tables] object UserTableJdbcRead {
  def listAll(connection: Connection): Vector[UserRow] = {
    val statement = connection.prepareStatement(
      s"${UserTableCodec.baseSelect} ORDER BY created_at ASC, id ASC"
    )
    try {
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[UserRow]
        while (resultSet.next()) {
          builder += UserTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, userId: String): Option[UserRow] = {
    val statement = connection.prepareStatement(s"${UserTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(UserTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def findByUsername(connection: Connection, username: String): Option[UserRow] = {
    val statement = connection.prepareStatement(s"${UserTableCodec.baseSelect} WHERE username = ?")
    try {
      statement.setString(1, username)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(UserTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def countByRole(connection: Connection, role: UserRole): Int = {
    val statement = connection.prepareStatement(
      """
        SELECT COUNT(*) AS user_count
        FROM users
        WHERE role = ?
      """
    )
    try {
      statement.setString(1, role.value)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) resultSet.getInt("user_count") else 0
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }
}
