package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.bird.AdminDirectorBirdSkillEntry
import microservice.admin.support.mapping.BirdHandoffMapping
import microservice.user.support.AccessControl
import microservice.bird.api.internal.director.GetDirectorBirdSkillInternalAPIMessage
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel

/** GET /admin/director/bird-skills/:birdType — 获取单个鸟种技能配置详情。 */
final case class GetDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String
) extends APIWithTokenMessage[AdminDirectorBirdSkillEntry] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminDirectorBirdSkillEntry]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        skillEntry <- PlanSteps.runApi(GetDirectorBirdSkillInternalAPIMessage(birdType), connection)
      } yield BirdHandoffMapping.toDirectorBirdSkillEntry(skillEntry)
    }
}
