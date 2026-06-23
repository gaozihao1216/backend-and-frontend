package microservice.admin.api.director.bird_skill

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.admin.support.director.bird_skill.DirectorBirdSkillSupport
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationAccess
import microservice.system.objects.AdminLevel
import microservice.admin.api.director.bird_skill.body.SaveDirectorBirdSkillBody

/** PUT /admin/director/bird-skills/:birdType — 保存/更新指定鸟种技能配置。 */
final case class SaveDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String,
  body: SaveDirectorBirdSkillBody
) extends APIWithTokenMessage[BirdSkillConfig] {
  override def token: String = userId

  /** plan：Director 权限 → catalog 存在性 → validateSkillsJson → upsert BirdSkillConfigTable。
    *
    * 关联：前端 `SaveDirectorBirdSkillApi`；skills 字段语义见 [[BirdSkillConfig]]。
    */
  override def plan(connection: Connection): IO[Either[HttpError, BirdSkillConfig]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- PlayerPreparationAccess.requireCatalogEntry(connection, birdType).map(_ => ())
        skills <- DirectorBirdSkillSupport.requireSkillsJson(body.skills)
        config <- PlanSteps.read(
          BirdSkillConfigTable.upsert(
            connection,
            BirdSkillConfig(
              birdType = birdType,
              skills = skills,
              modelImageUrl = body.modelImageUrl.filter(_.trim.nonEmpty),
              updatedById = Some(userId),
              updatedAt = BirdSkillConfigTable.nowIso
            )
          )
        )
      } yield config
    }
}
