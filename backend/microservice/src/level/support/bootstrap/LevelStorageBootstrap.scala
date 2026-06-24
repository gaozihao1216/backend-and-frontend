package microservice.level.support.bootstrap

import java.sql.Connection
import microservice.level.tables.comment.CommentTableInitializer
import microservice.level.tables.favorite.FavoriteTableInitializer
import microservice.level.tables.level.LevelTableInitializer
import microservice.level.tables.rating.RatingTableInitializer
import microservice.level.tables.slot_assignment.LevelSlotAssignmentTableInitializer
import microservice.level.tables.submission.SubmissionTableInitializer

/** level 模块存储初始化入口（供 system 启动编排调用）。 */
private[level] object LevelStorageBootstrap {
  def initialize(connection: Connection): Unit = {
    LevelTableInitializer.initialize(connection)
    SubmissionTableInitializer.initialize(connection)
    LevelSlotAssignmentTableInitializer.initialize(connection)
    RatingTableInitializer.initialize(connection)
    CommentTableInitializer.initialize(connection)
    FavoriteTableInitializer.initialize(connection)
  }
}
