package microservice.bird.api.internal.director

import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.skill.director.DirectorBirdSkillBoard
import microservice.bird.support.director.BirdSkillDirectorSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：总监鸟类技能看板；由 admin HTTP API 调用，不挂路由。 */
final case class GetDirectorBirdSkillBoardInternalAPIMessage() extends APIMessage[DirectorBirdSkillBoard] {
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillBoard]] =
    PlanSteps.finish {
      PlanSteps.read(BirdSkillDirectorSupport.buildBoard(connection))
    }
}
