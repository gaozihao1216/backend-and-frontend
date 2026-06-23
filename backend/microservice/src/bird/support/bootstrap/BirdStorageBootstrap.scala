package microservice.bird.support.bootstrap

import java.sql.Connection
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.bird.tables.submission.BirdSubmissionTable

/** bird 模块存储初始化入口（供 system 启动编排调用）。 */
object BirdStorageBootstrap {
  def initialize(connection: Connection): Unit = {
    BirdDesignTable.initialize(connection)
    BirdSubmissionTable.initialize(connection)
    BirdSkillConfigTable.initialize(connection)
  }
}
