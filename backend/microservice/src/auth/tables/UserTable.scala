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
  def all: Vector[UserRow] =
    InMemoryStore.users

  def listAll(connection: Connection): Vector[UserRow] =
    InMemoryStore.users

  def findById(userId: String): Option[UserRow] =
    InMemoryStore.users.find(_.id == userId)

  def findById(connection: Connection, userId: String): Option[UserRow] =
    findById(userId)

  def findByUsername(username: String): Option[UserRow] =
    InMemoryStore.users.find(_.username == username)

  def findByUsername(connection: Connection, username: String): Option[UserRow] =
    findByUsername(username)

  def countByRole(role: UserRole): Int =
    InMemoryStore.users.count(_.role == role)

  def countByRole(connection: Connection, role: UserRole): Int =
    countByRole(role)

  def insert(row: UserRow): UserRow = {
    InMemoryStore.users = InMemoryStore.users :+ row
    row
  }

  def insert(connection: Connection, row: UserRow): UserRow =
    insert(row)
}
