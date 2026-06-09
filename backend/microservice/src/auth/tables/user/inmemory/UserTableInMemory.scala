package microservice.auth.tables.user.inmemory

import microservice.auth.tables.user._

import microservice.infrastructure.database.InMemoryStore
import microservice.system.objects.{AdminLevel, UserRole}

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
      case -1 => None
      case index =>
        val existing = InMemoryStore.users(index)
        if (
          existing.role == UserRole.Admin &&
          adminLevel.contains(AdminLevel.Director) &&
          InMemoryStore.users.exists(user => user.id != userId && user.role == UserRole.Admin && user.adminLevel.contains(AdminLevel.Director))
        ) {
          throw new IllegalStateException("Only one director admin is allowed")
        }
        val updated = existing.copy(adminLevel = if (existing.role == UserRole.Admin) adminLevel else None, updatedAt = updatedAt)
        InMemoryStore.users = InMemoryStore.users.updated(index, updated)
        Some(updated)
    }
  }
}
