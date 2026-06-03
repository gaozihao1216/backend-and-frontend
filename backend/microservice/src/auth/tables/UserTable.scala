package microservice.auth.tables

import microservice.system.objects.UserRole
import java.sql.Connection

object UserTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) UserTableJdbc.initialize(connection)

  def listAll(connection: Connection): Vector[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.listAll()
    } else {
      UserTableJdbc.listAll(connection)
    }

  def findById(connection: Connection, userId: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.findById(userId)
    } else {
      UserTableJdbc.findById(connection, userId)
    }

  def findByUsername(connection: Connection, username: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.findByUsername(username)
    } else {
      UserTableJdbc.findByUsername(connection, username)
    }

  def countByRole(connection: Connection, role: UserRole): Int =
    if (isInMemory(connection)) {
      UserTableInMemory.countByRole(role)
    } else {
      UserTableJdbc.countByRole(connection, role)
    }

  def insert(connection: Connection, row: UserRow): UserRow =
    if (isInMemory(connection)) {
      UserTableInMemory.insert(row)
    } else {
      UserTableJdbc.insert(connection, row)
    }
}
