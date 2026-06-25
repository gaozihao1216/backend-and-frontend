package microservice.user.tables.user

import microservice.system.objects.enums.AdminLevel
import microservice.system.objects.enums.UserRole
import microservice.user.objects.identity.BackendUser
import java.sql.{ResultSet, SQLException}
import java.sql.Connection
import microservice.user.tables.user._

/** 用户表存储层行模型（PostgreSQL users 表列对齐）。
  *
  * 定义：id/username/displayName/role/adminLevel/时间戳 七字段 case class。
  * 问题：API 不宜直接暴露 SQL 列布局与 snake_case 命名。
  * 作用：UserTable CRUD 的边界类型；adminLevel 仅 role=admin 时有值。
  * 关联：[[UserRowMapper.toBackendUser]] → [[BackendUser]]；[[UserTableCodec]] JDBC 映射。
  */
final case class UserRow(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  adminLevel: Option[AdminLevel], // role!=admin 时应为 None
  createdAt: String,
  updatedAt: String
)

/** UserRow ↔ BackendUser 映射层。
  *
  * 定义：toBackendUser 纯函数，字段一一拷贝。
  * 问题：隔离存储 Row 与 API 对象，避免 Table 层依赖 Circe JSON。
  * 作用：bind/profile/backend-users 响应统一经此转换。
  * 关联：[[BackendUser]]、[[UserRow]]；各 user APIMessage PlanSteps.read。
  */
object UserRowMapper {

  /** 将数据库/InMemory 行转为 API 层 BackendUser（字段一一对应，无额外业务逻辑）。 */
  def toBackendUser(row: UserRow): BackendUser =
    BackendUser(
      row.id,
      row.username,
      row.displayName,
      row.role,
      row.adminLevel,
      row.createdAt,
      row.updatedAt
    )
}

/** JDBC 读路径：SQL 列名 ↔ UserRow 编解码。
  *
  * 定义：baseSelect SQL 片段 + rowFromResultSet 解析函数。
  * 问题：role/adminLevel 存字符串，需 fromString 并非法值抛 SQLException 回滚事务。
  * 作用：UserTable 所有 SELECT 复用 baseSelect。
  * 关联：[[UserTable]]。
  */
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
