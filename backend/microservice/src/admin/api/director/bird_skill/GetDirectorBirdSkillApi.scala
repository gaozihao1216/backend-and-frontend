package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.skill.director.DirectorBirdSkillEntry
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationAccess
import microservice.system.objects.AdminLevel

/** GET /admin/director/bird-skills/:birdType — 获取单个鸟种技能配置详情。 */
final case class GetDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String
) extends APIWithTokenMessage[DirectorBirdSkillEntry] {
  override def token: String = userId

  /** plan：Director 权限 → catalog 条目 → 合并 BirdSkillConfigTable（只读）。
    *
    * 关联：前端 `GetDirectorBirdSkillApi`；响应结构见 [[DirectorBirdSkillEntry]]。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillEntry]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        entry <- PlayerPreparationAccess.requireCatalogEntry(connection, birdType)
        skillEntry <- PlanSteps.read {
          val config = BirdSkillConfigTable.findByBirdType(connection, birdType)
          DirectorBirdSkillEntry(
            birdType = entry.birdType,
            name = entry.name,
            source = entry.source,
            authorId = entry.authorId,
            skillName = entry.skillName,
            tierSkillDescriptions = entry.tierSkillDescriptions.toList,
            configured = config.isDefined,
            skills = config.map(_.skills),
            modelImageUrl = config.flatMap(_.modelImageUrl).orElse(Some(entry.previewImageUrl))
          )
        }
      } yield skillEntry
    }
}
