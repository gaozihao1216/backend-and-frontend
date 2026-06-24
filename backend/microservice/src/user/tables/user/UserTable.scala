package microservice.user.tables.user

import java.sql.Connection
import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole
import microservice.user.tables.user._

object UserTable {

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

def insert(connection: Connection, row: UserRow): UserRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO users (id, username, display_name, role, admin_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.username)
      statement.setString(3, row.displayName)
      statement.setString(4, row.role.value)
      row.adminLevel match {
        case Some(adminLevel) => statement.setString(5, adminLevel.value)
        case None             => statement.setNull(5, java.sql.Types.VARCHAR)
      }
      statement.setString(6, row.createdAt)
      statement.setString(7, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  /** 更新 admin_level；若 id 不存在返回 None；成功则 re-read 最新行。 */
  def updateAdminLevel(connection: Connection, userId: String, adminLevel: Option[AdminLevel], updatedAt: String): Option[UserRow] = {
    val statement = connection.prepareStatement(
      """
        UPDATE users
        SET admin_level = ?, updated_at = ?
        WHERE id = ?
      """
    )
    try {
      adminLevel match {
        case Some(level) => statement.setString(1, level.value)
        case None        => statement.setNull(1, java.sql.Types.VARCHAR)
      }
      statement.setString(2, updatedAt)
      statement.setString(3, userId)
      val updatedCount = statement.executeUpdate()
      if (updatedCount == 0) None else UserTable.findById(connection, userId)
    } finally {
      statement.close()
    }
  }
}
