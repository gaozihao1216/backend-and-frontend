package microservice.user.tables.user.jdbc

import microservice.user.tables.user._

import java.sql.Connection

/** PostgreSQL users 表的 DDL 与种子数据（JDBC 模式首次 initialize 时执行）。 */
private[tables] object UserTableJdbcSchema {

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

      // 预置总监演示账号 admin-director-1（与 SystemSeedData 一致）
      statement.executeUpdate(
        """
          INSERT INTO users (id, username, display_name, role, admin_level, created_at, updated_at)
          VALUES (
            'admin-director-1',
            '001',
            '001',
            'admin',
            'director',
            '2026-06-03T00:00:00Z',
            '2026-06-03T00:00:00Z'
          )
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            role = EXCLUDED.role,
            admin_level = EXCLUDED.admin_level,
            updated_at = EXCLUDED.updated_at
        """
      )
    } finally {
      statement.close()
    }
  }
}
