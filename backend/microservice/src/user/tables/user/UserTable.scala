package microservice.user.tables.user

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.system.objects.{AdminLevel, UserRole}
import microservice.user.tables.user.jdbc.UserTableJdbc

/** 用户表访问门面：in-memory 与 JDBC 双实现分流。
  *
  * 定义：object 暴露 initialize/listAll/findById/findByUsername/countByRole/insert/updateAdminLevel。
  * 问题：演示 in-memory 与生产 JDBC 需同一 API，APIMessage 不应感知存储后端。
  * 作用：connection==null → InMemoryStore；否则 UserTableJdbc。
  * 关联：[[BindBackendUserAPIMessage]]、[[AccessControl]]、[[GetUserProfileAPIMessage]]。
  */
object UserTable {
  /** 启动时建表/迁移；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) UserTableJdbc.initialize(connection)

  /** 返回全部用户（GetBackendUsers 使用）。 */
  def listAll(connection: Connection): Vector[UserRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.users
    } else {
      UserTableJdbc.listAll(connection)
    }

  /** 按主键 id 查询（AccessControl、GetUserProfile 等）。 */
  def findById(connection: Connection, userId: String): Option[UserRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.users.find(_.id == userId)
    } else {
      UserTableJdbc.findById(connection, userId)
    }

  /** 按 username 唯一键查询（BindBackendUser 幂等绑定）。 */
  def findByUsername(connection: Connection, username: String): Option[UserRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.users.find(_.username == username)
    } else {
      UserTableJdbc.findByUsername(connection, username)
    }

  /** 统计某角色已有用户数，用于 bind 时生成 player-N / designer-N 形式 id。 */
  def countByRole(connection: Connection, role: UserRole): Int =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.users.count(_.role == role)
    } else {
      UserTableJdbc.countByRole(connection, role)
    }

  /** 插入新用户行。 */
  def insert(connection: Connection, row: UserRow): UserRow =
    if (TableConnection.isInMemory(connection)) {
      if (
        row.role == UserRole.Admin &&
        row.adminLevel.contains(AdminLevel.Director) &&
        InMemoryStore.users.exists(user => user.role == UserRole.Admin && user.adminLevel.contains(AdminLevel.Director))
      ) {
        throw new IllegalStateException("Only one director admin is allowed")
      }
      InMemoryStore.users = InMemoryStore.users :+ row
      row
    } else {
      UserTableJdbc.insert(connection, row)
    }

  /** 更新管理员等级（TransferDirectorPermission 等总监能力使用）。 */
  def updateAdminLevel(connection: Connection, userId: String, adminLevel: Option[AdminLevel], updatedAt: String): Option[UserRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.users.indexWhere(_.id == userId) match {
        case -1 =>
          None
        case index =>
          val existing = InMemoryStore.users(index)
          if (
            existing.role == UserRole.Admin &&
            adminLevel.contains(AdminLevel.Director) &&
            InMemoryStore.users.exists(user =>
              user.id != userId && user.role == UserRole.Admin && user.adminLevel.contains(AdminLevel.Director)
            )
          ) {
            throw new IllegalStateException("Only one director admin is allowed")
          }
          val updated = existing.copy(
            adminLevel = if (existing.role == UserRole.Admin) adminLevel else None,
            updatedAt = updatedAt
          )
          InMemoryStore.users = InMemoryStore.users.updated(index, updated)
          Some(updated)
      }
    } else {
      UserTableJdbc.updateAdminLevel(connection, userId, adminLevel, updatedAt)
    }
}
