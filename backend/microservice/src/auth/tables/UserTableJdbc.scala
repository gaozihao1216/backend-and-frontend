package microservice.auth.tables

import microservice.system.objects.UserRole
import java.sql.Connection

private[tables] object UserTableJdbc {
  def initialize(connection: Connection): Unit =
    UserTableJdbcSchema.initialize(connection)

  def listAll(connection: Connection): Vector[UserRow] =
    UserTableJdbcRead.listAll(connection)

  def findById(connection: Connection, userId: String): Option[UserRow] =
    UserTableJdbcRead.findById(connection, userId)

  def findByUsername(connection: Connection, username: String): Option[UserRow] =
    UserTableJdbcRead.findByUsername(connection, username)

  def countByRole(connection: Connection, role: UserRole): Int =
    UserTableJdbcRead.countByRole(connection, role)

  def insert(connection: Connection, row: UserRow): UserRow =
    UserTableJdbcWrite.insert(connection, row)
}
