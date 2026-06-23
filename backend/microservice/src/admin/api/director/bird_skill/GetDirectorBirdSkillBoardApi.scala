package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.admin.support.director.bird_skill.DirectorBirdSkillSupport
import microservice.bird.objects.skill.director.DirectorBirdSkillBoard
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel

/** GET /admin/director/bird-skills/board — 拉取全部鸟种技能配置看板。 */
final case class GetDirectorBirdSkillBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorBirdSkillBoard] {
  override def token: String = userId

  /** plan：校验 Director 权限 → DirectorBirdSkillSupport.buildBoard（只读）。
    *
    * 关联：前端 `GetDirectorBirdSkillBoardApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillBoard]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        board <- PlanSteps.read(DirectorBirdSkillSupport.buildBoard(connection))
      } yield board
    }
}
