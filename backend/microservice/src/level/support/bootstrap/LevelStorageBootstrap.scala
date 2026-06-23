package microservice.level.support.bootstrap

import java.sql.Connection
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.rating.RatingTable
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTable
import microservice.level.tables.submission.SubmissionTable

/** level 模块存储初始化入口（供 system 启动编排调用）。 */
object LevelStorageBootstrap {
  def initialize(connection: Connection): Unit = {
    LevelTable.initialize(connection)
    SubmissionTable.initialize(connection)
    LevelSlotAssignmentTable.initialize(connection)
    RatingTable.initialize(connection)
    CommentTable.initialize(connection)
    FavoriteTable.initialize(connection)
  }
}
