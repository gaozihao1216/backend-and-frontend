package microservice.bird.api.internal.player

import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.support.skill_config.BirdSkillConfigReadSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：读取全部鸟类技能配置映射；由 player HTTP API 调用，不挂路由。 */
final case class GetBirdSkillConfigMapInternalAPIMessage() extends APIMessage[Map[String, BirdSkillConfig]] {
  override def plan(connection: Connection): IO[Either[HttpError, Map[String, BirdSkillConfig]]] =
    PlanSteps.finish {
      PlanSteps.read(BirdSkillConfigReadSupport.skillsMap(connection))
    }
}
