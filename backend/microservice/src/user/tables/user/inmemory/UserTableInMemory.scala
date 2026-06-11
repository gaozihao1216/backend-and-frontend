package microservice.user.tables.user.inmemory

import microservice.user.tables.user._

import microservice.infrastructure.database.InMemoryStore
import microservice.system.objects.{AdminLevel, UserRole}

/** InMemoryStore.users 上的用户 CRUD；演示模式与单元测试使用。 */
private[tables] object UserTableInMemory {

  def listAll(): Vector[UserRow] =
    InMemoryStore.users

  def findById(userId: String): Option[UserRow] =
    InMemoryStore.users.find(_.id == userId)

  def findByUsername(username: String): Option[UserRow] =
    InMemoryStore.users.find(_.username == username)

  def countByRole(role: UserRole): Int =
    InMemoryStore.users.count(_.role == role)

  def insert(row: UserRow): UserRow = {
    // 业务约束：全系统只允许一名 director 管理员（与 JDBC 部分唯一索引一致）
    if (
      row.role == UserRole.Admin &&
      row.adminLevel.contains(AdminLevel.Director) &&
      InMemoryStore.users.exists(user => user.role == UserRole.Admin && user.adminLevel.contains(AdminLevel.Director))
    ) {
      throw new IllegalStateException("Only one director admin is allowed")
    }
    InMemoryStore.users = InMemoryStore.users :+ row
    row
  }

  def updateAdminLevel(userId: String, adminLevel: Option[AdminLevel], updatedAt: String): Option[UserRow] = {
    InMemoryStore.users.indexWhere(_.id == userId) match {
      case -1 =>
        None

      case index =>
        val existing = InMemoryStore.users(index)

        // 若要把某 admin 提升为 director，需确保尚无其他 director
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
  }
}
