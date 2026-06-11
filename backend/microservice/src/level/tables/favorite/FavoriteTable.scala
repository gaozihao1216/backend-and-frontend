package microservice.level.tables.favorite

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.favorite.inmemory._
import microservice.level.tables.favorite.jdbc._

import microservice.level.objects.Favorite
import java.sql.Connection

/** 关卡收藏表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：isInMemory(connection) 为 true 时走 FavoriteTableInMemory；否则走 JDBC 读写层。
  * 关联：FavoriteLevel/UnfavoriteLevel/GetFavoriteLevels APIMessage。
  */
object FavoriteTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) FavoriteTableJdbcSchema.initialize(connection)

  /** 统计指定用户的收藏总数。 */
  def countByUser(connection: Connection, userId: String): Int =
    if (isInMemory(connection)) FavoriteTableInMemory.countByUser(userId)
    else FavoriteTableJdbcRead.countByUser(connection, userId)

  /** 列出用户收藏的全部已发布关卡（Favorite + LevelRow 元组）。 */
  def listPublishedByUser(connection: Connection, userId: String): Vector[(Favorite, LevelRow)] =
    if (isInMemory(connection)) FavoriteTableInMemory.listPublishedByUser(userId)
    else FavoriteTableJdbcRead.listPublishedByUser(connection, userId)

  /** 查找用户对指定关卡的收藏记录。 */
  def find(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (isInMemory(connection)) FavoriteTableInMemory.find(userId, levelId)
    else FavoriteTableJdbcRead.find(connection, userId, levelId)

  /** 生成下一个收藏 ID。 */
  def nextId(connection: Connection): String =
    if (isInMemory(connection)) FavoriteTableInMemory.nextId()
    else FavoriteTableJdbcRead.nextId(connection)

  /** 插入新收藏记录。 */
  def insert(connection: Connection, favorite: Favorite): Favorite =
    if (isInMemory(connection)) FavoriteTableInMemory.insert(favorite)
    else FavoriteTableJdbcWrite.insert(connection, favorite)

  /** 删除收藏记录；返回被删除的 Favorite（若存在）。 */
  def delete(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    if (isInMemory(connection)) FavoriteTableInMemory.delete(userId, levelId)
    else FavoriteTableJdbcWrite.delete(connection, userId, levelId)
}
