package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.bird.AdminBirdSkillConfig
import microservice.admin.support.mapping.BirdHandoffMapping
import microservice.user.support.AccessControl
import microservice.bird.api.internal.director.SaveDirectorBirdSkillInternalAPIMessage
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.AdminLevel
import microservice.admin.objects.director.bird_skill.request.SaveDirectorBirdSkillRequest

/** PUT /admin/director/bird-skills/:birdType — 保存/更新指定鸟种技能配置。 */
final case class SaveDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String,
  body: SaveDirectorBirdSkillRequest
) extends APIWithTokenMessage[AdminBirdSkillConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminBirdSkillConfig]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
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
