package microservice.user.tables.user.jdbc

import microservice.user.tables.user._

import java.sql.Connection
import microservice.system.objects.AdminLevel

/** users 表 JDBC 写操作。
  *
  * 定义：insert 与 updateAdminLevel 两个写入口。
  * 问题：admin_level NULL 与 Option 映射需 setNull；update 后 re-read 保证返回最新行。
  * 作用：INSERT 新 bind 用户；UPDATE director 权限转移。
  * 关联：[[UserTable]] 写分流；[[UserTableJdbcRead.findById]] re-read。
  */
private[tables] object UserTableJdbcWrite {

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
      if (updatedCount == 0) None else UserTableJdbcRead.findById(connection, userId)
    } finally {
      statement.close()
    }
  }
}
