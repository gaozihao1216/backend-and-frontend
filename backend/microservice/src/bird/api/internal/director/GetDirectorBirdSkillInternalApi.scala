package microservice.bird.api.internal.director

import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.skill.director.DirectorBirdSkillEntry
import microservice.bird.support.director.BirdSkillDirectorSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：单鸟种技能配置详情；由 admin HTTP API 调用，不挂路由。 */
final case class GetDirectorBirdSkillInternalAPIMessage(birdType: String) extends APIMessage[DirectorBirdSkillEntry] {
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillEntry]] =
    PlanSteps.finish {
      BirdSkillDirectorSupport.requireEntry(connection, birdType)
    }
}
