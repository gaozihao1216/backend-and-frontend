package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.bird.AdminBirdSkillConfig
import microservice.admin.support.mapping.BirdHandoffMapping
import microservice.user.support.AccessControl
import microservice.bird.api.internal.director.SaveDirectorBirdSkillInternalAPIMessage
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.admin.body.director.bird_skill.SaveDirectorBirdSkillBody

/** PUT /admin/director/bird-skills/:birdType — 保存/更新指定鸟种技能配置。 */
final case class SaveDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String,
  body: SaveDirectorBirdSkillBody
) extends APIWithTokenMessage[AdminBirdSkillConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminBirdSkillConfig]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        config <- PlanSteps.runApi(
          SaveDirectorBirdSkillInternalAPIMessage(
            userId = userId,
            birdType = birdType,
            skills = body.skills,
            modelImageUrl = body.modelImageUrl
          ),
          connection
        )
      } yield BirdHandoffMapping.toBirdSkillConfig(config)
    }
}
