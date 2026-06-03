package microservice.auth.tables

import microservice.core.InMemoryStore
import microservice.system.objects.UserRole
import java.sql.Connection

final case class UserRow(
  id: String,
  username: String,
  displayName: String,
  role: UserRole,
  createdAt: String,
  updatedAt: String
)

object UserTable {
  def listAll(connection: Connection): Vector[UserRow] =
    InMemoryStore.users

  def findById(connection: Connection, userId: String): Option[UserRow] =
    InMemoryStore.users.find(_.id == userId)

  def findByUsername(connection: Connection, username: String): Option[UserRow] =
    InMemoryStore.users.find(_.username == username)

  def countByRole(connection: Connection, role: UserRole): Int =
    InMemoryStore.users.count(_.role == role)

  def insert(connection: Connection, row: UserRow): UserRow = {
    InMemoryStore.users = InMemoryStore.users :+ row
    row
  }
}
