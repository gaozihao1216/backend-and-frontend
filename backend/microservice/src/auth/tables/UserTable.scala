package microservice.auth.tables

import microservice.system.objects.{AdminLevel, UserRole}
import java.sql.Connection

object UserTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) UserTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.listAll()
    } else {
      UserTableJdbcRead.listAll(connection)
    }

  def findById(connection: Connection, userId: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.findById(userId)
    } else {
      UserTableJdbcRead.findById(connection, userId)
    }

  def findByUsername(connection: Connection, username: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.findByUsername(username)
    } else {
      UserTableJdbcRead.findByUsername(connection, username)
    }

  def countByRole(connection: Connection, role: UserRole): Int =
    if (isInMemory(connection)) {
      UserTableInMemory.countByRole(role)
    } else {
      UserTableJdbcRead.countByRole(connection, role)
    }

  def insert(connection: Connection, row: UserRow): UserRow =
    if (isInMemory(connection)) {
      UserTableInMemory.insert(row)
    } else {
      UserTableJdbcWrite.insert(connection, row)
    }

  def updateAdminLevel(connection: Connection, userId: String, adminLevel: Option[AdminLevel], updatedAt: String): Option[UserRow] =
    if (isInMemory(connection)) {
      UserTableInMemory.updateAdminLevel(userId, adminLevel, updatedAt)
    } else {
      UserTableJdbcWrite.updateAdminLevel(connection, userId, adminLevel, updatedAt)
    }
}
