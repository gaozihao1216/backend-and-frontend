package microservice.level.tables

import java.sql.Connection
import microservice.level.objects.Favorite

private[tables] object FavoriteTableJdbc {
  def initialize(connection: Connection): Unit =
    FavoriteTableJdbcSchema.initialize(connection)

  def countByUser(connection: Connection, userId: String): Int =
    FavoriteTableJdbcRead.countByUser(connection, userId)

  def listPublishedByUser(connection: Connection, userId: String): Vector[(Favorite, LevelRow)] =
    FavoriteTableJdbcRead.listPublishedByUser(connection, userId)

  def find(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    FavoriteTableJdbcRead.find(connection, userId, levelId)

  def nextId(connection: Connection): String =
    FavoriteTableJdbcRead.nextId(connection)

  def insert(connection: Connection, favorite: Favorite): Favorite =
    FavoriteTableJdbcWrite.insert(connection, favorite)

  def delete(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    FavoriteTableJdbcWrite.delete(connection, userId, levelId)
}
