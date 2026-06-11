package microservice.user.tables.user

import microservice.user.tables.user.inmemory._
import microservice.user.tables.user.jdbc._

import microservice.system.objects.{AdminLevel, UserRole}
import java.sql.Connection

/** 用户表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 关联：BindBackendUser、AccessControl、GetUserProfile 等均通过此对象读写用户。
  * 实现：connection == null 表示 DatabaseSession.inMemory；否则走 PostgreSQL。
  */
object UserTable {

  /** in-memory 模式下 Main 传入的 connection 为 null。 */
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表/迁移；仅 JDBC 模式执行 DDL（见 UserTableJdbcSchema）。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) UserTableJdbcSchema.initialize(connection)

  /** 返回全部用户（GetBackendUsers 使用）。 */
  def listAll(connection: Connection): Vector[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.listAll()
    } else {
      UserTableJdbcRead.listAll(connection)
    }

  /** 按主键 id 查询（AccessControl、GetUserProfile 等）。 */
  def findById(connection: Connection, userId: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.findById(userId)
    } else {
      UserTableJdbcRead.findById(connection, userId)
    }

  /** 按 username 唯一键查询（BindBackendUser 幂等绑定）。 */
  def findByUsername(connection: Connection, username: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.findByUsername(username)
    } else {
      UserTableJdbcRead.findByUsername(connection, username)
    }

  /** 统计某角色已有用户数，用于 bind 时生成 player-N / designer-N 形式 id。 */
  def countByRole(connection: Connection, role: UserRole): Int =
    if (isInMemory(connection)) {
      UserTableInMemory.countByRole(role)
    } else {
      UserTableJdbcRead.countByRole(connection, role)
    }

  /** 插入新用户行。 */
  def insert(connection: Connection, row: UserRow): UserRow =
    if (isInMemory(connection)) {
      UserTableInMemory.insert(row)
    } else {
      UserTableJdbcWrite.insert(connection, row)
    }

  /** 更新管理员等级（TransferDirectorPermission 等总监能力使用）。 */
  def updateAdminLevel(connection: Connection, userId: String, adminLevel: Option[AdminLevel], updatedAt: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.updateAdminLevel(userId, adminLevel, updatedAt)
    } else {
      UserTableJdbcWrite.updateAdminLevel(connection, userId, adminLevel, updatedAt)
    }
}
