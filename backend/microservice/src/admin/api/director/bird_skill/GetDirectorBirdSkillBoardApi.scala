package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.bird.AdminDirectorBirdSkillBoard
import microservice.admin.support.mapping.BirdHandoffMapping
import microservice.user.support.AccessControl
import microservice.bird.api.internal.director.GetDirectorBirdSkillBoardInternalAPIMessage
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel

/** GET /admin/director/bird-skills/board — 拉取全部鸟种技能配置看板。 */
final case class GetDirectorBirdSkillBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[AdminDirectorBirdSkillBoard] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, AdminDirectorBirdSkillBoard]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        board <- PlanSteps.runApi(GetDirectorBirdSkillBoardInternalAPIMessage(), connection)
      } yield BirdHandoffMapping.toDirectorBirdSkillBoard(board)
    }
}
