package microservice.user.tables.user.jdbc

import microservice.user.tables.user._

import microservice.system.objects.UserRole
import java.sql.Connection

/** users 表 JDBC 只读操作。
  *
  * 定义：listAll/findById/findByUsername/countByRole 四个 SELECT 入口。
  * 问题：需正确关闭 Statement/ResultSet 避免连接泄漏。
  * 作用：参数化 WHERE/ORDER BY，ResultSet 经 UserTableCodec 转 Row。
  * 关联：[[UserTable]] 读分流；[[UserTableCodec.baseSelect]]。
  */
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
