package microservice.auth.tables

import microservice.infrastructure.database.InMemoryStore
import microservice.system.objects.UserRole

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
    InMemoryStore.users = InMemoryStore.users :+ row
    row
  }
}
