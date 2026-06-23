package microservice.bird.support.skill_config

import java.sql.Connection
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.tables.skill_config.BirdSkillConfigTable

/** 鸟类技能配置只读（bird 模块内）。 */
object BirdSkillConfigReadSupport {
  def skillsMap(connection: Connection): Map[String, BirdSkillConfig] =
    BirdSkillConfigTable.skillsJsonMap(connection)
}
