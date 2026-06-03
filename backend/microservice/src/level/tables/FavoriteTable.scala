package microservice.level.tables

import microservice.level.objects.Favorite
import java.sql.Connection

object FavoriteTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) FavoriteTableJdbc.initialize(connection)

  def countByUser(connection: Connection, userId: String): Int =
    if (isInMemory(connection)) FavoriteTableInMemory.countByUser(userId)
    else FavoriteTableJdbc.countByUser(connection, userId)

  def listPublishedByUser(connection: Connection, userId: String): Vector[(Favorite, LevelRow)] =
    if (isInMemory(connection)) FavoriteTableInMemory.listPublishedByUser(userId)
    else FavoriteTableJdbc.listPublishedByUser(connection, userId)

  def find(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (isInMemory(connection)) FavoriteTableInMemory.find(userId, levelId)
    else FavoriteTableJdbc.find(connection, userId, levelId)

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) FavoriteTableInMemory.nextId()
    else FavoriteTableJdbc.nextId(connection)

  def insert(connection: Connection, favorite: Favorite): Favorite =
    if (isInMemory(connection)) FavoriteTableInMemory.insert(favorite)
    else FavoriteTableJdbc.insert(connection, favorite)

  def delete(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (isInMemory(connection)) FavoriteTableInMemory.delete(userId, levelId)
    else FavoriteTableJdbc.delete(connection, userId, levelId)
}
