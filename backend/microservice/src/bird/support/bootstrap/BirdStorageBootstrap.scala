package microservice.bird.support.bootstrap

import java.sql.Connection
import microservice.bird.tables.design.BirdDesignTableInitializer
import microservice.bird.tables.skill_config.BirdSkillConfigTableInitializer
import microservice.bird.tables.submission.BirdSubmissionTableInitializer

/** bird 模块存储初始化入口（供 system 启动编排调用）。 */
private[bird] object BirdStorageBootstrap {
  def initialize(connection: Connection): Unit = {
    BirdDesignTableInitializer.initialize(connection)
    BirdSubmissionTableInitializer.initialize(connection)
    BirdSkillConfigTableInitializer.initialize(connection)
  }
}
