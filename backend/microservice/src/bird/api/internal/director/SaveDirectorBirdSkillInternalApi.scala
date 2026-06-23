package microservice.bird.api.internal.director

import cats.effect.IO
import java.sql.Connection
import io.circe.Json
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.support.director.BirdSkillDirectorSupport
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：保存鸟种技能配置；由 admin HTTP API 调用，不挂路由。 */
final case class SaveDirectorBirdSkillInternalAPIMessage(
  userId: String,
  birdType: String,
  skills: Json,
  modelImageUrl: Option[String]
) extends APIMessage[BirdSkillConfig] {
  override def plan(connection: Connection): IO[Either[HttpError, BirdSkillConfig]] =
    PlanSteps.finish {
      for {
        validated <- BirdSkillDirectorSupport.requireSkillsJson(skills)
        config <- BirdSkillDirectorSupport.requireSaveConfig(connection, userId, birdType, validated, modelImageUrl)
      } yield config
    }
}
