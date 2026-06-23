package microservice.user.tables.user.jdbc

import java.sql.Connection
import microservice.system.objects.AdminLevel
import microservice.system.objects.UserRole
import microservice.user.tables.user._

private[tables] object UserTableJdbc {
def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      // 创建 users 主表
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL,
            admin_level TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        """
      )

      // 兼容旧库：补 admin_level 列
      statement.executeUpdate("ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_level TEXT")

      // 已有 admin 若无等级，默认 standard
      statement.executeUpdate("UPDATE users SET admin_level = 'standard' WHERE role = 'admin' AND admin_level IS NULL")

      // 部分唯一索引：只允许一条 director 记录
      statement.executeUpdate(
        """
          CREATE UNIQUE INDEX IF NOT EXISTS users_single_director_admin
          ON users (admin_level)
          WHERE role = 'admin' AND admin_level = 'director'
        """
      )

      // 预置演示账号（与 SystemSeedData / init-store.sql 一致）
      val demoUsersSeed =
        """
          INSERT INTO users (id, username, display_name, role, admin_level, created_at, updated_at) VALUES
            ('player-1', 'local-player-0000001', 'Player One', 'player', NULL, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
            ('designer-1', 'local-designer-0000002', 'Designer One', 'designer', NULL, '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
            ('admin-1', 'local-admin-0000003', 'Admin One', 'admin', 'standard', '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z'),
            ('admin-director-1', '001', '001', 'admin', 'director', '2026-06-03T00:00:00Z', '2026-06-03T00:00:00Z')
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            role = EXCLUDED.role,
            admin_level = EXCLUDED.admin_level,
            updated_at = EXCLUDED.updated_at
        """
      statement.executeUpdate(demoUsersSeed)
    } finally {
      statement.close()
    }
  }

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
      if (updatedCount == 0) None else UserTableJdbc.findById(connection, userId)
    } finally {
      statement.close()
    }
  }
}
