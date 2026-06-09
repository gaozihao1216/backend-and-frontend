package microservice.level.tables.favorite

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.favorite.inmemory._
import microservice.level.tables.favorite.jdbc._

import microservice.level.objects.Favorite
import java.sql.Connection

object FavoriteTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) FavoriteTableJdbcSchema.initialize(connection)

  def countByUser(connection: Connection, userId: String): Int =
    if (isInMemory(connection)) FavoriteTableInMemory.countByUser(userId)
    else FavoriteTableJdbcRead.countByUser(connection, userId)

  def listPublishedByUser(connection: Connection, userId: String): Vector[(Favorite, LevelRow)] =
    if (isInMemory(connection)) FavoriteTableInMemory.listPublishedByUser(userId)
    else FavoriteTableJdbcRead.listPublishedByUser(connection, userId)

  def find(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (isInMemory(connection)) FavoriteTableInMemory.find(userId, levelId)
    else FavoriteTableJdbcRead.find(connection, userId, levelId)

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) FavoriteTableInMemory.nextId()
    else FavoriteTableJdbcRead.nextId(connection)

  def insert(connection: Connection, favorite: Favorite): Favorite =
    if (isInMemory(connection)) FavoriteTableInMemory.insert(favorite)
    else FavoriteTableJdbcWrite.insert(connection, favorite)

  def delete(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (isInMemory(connection)) FavoriteTableInMemory.delete(userId, levelId)
    else FavoriteTableJdbcWrite.delete(connection, userId, levelId)
}
