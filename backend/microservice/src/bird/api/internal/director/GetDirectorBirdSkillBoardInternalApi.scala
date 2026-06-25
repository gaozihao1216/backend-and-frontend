package microservice.bird.api.internal.director

import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.skill.director.DirectorBirdSkillBoard
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.objects.skill.director.DirectorBirdSkillEntry
import microservice.bird.support.catalog.{BirdCatalogReadSupport, DirectorCatalogEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：总监鸟类技能看板；由 admin HTTP API 调用，不挂路由。 */
final case class GetDirectorBirdSkillBoardInternalAPIMessage() extends APIMessage[DirectorBirdSkillBoard] {
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillBoard]] =
    PlanSteps.finish {
      PlanSteps.read {
        val configured = BirdSkillConfigTable.skillsJsonMap(connection)
        val birds =
          BirdCatalogReadSupport.listDirectorCatalogEntries(connection).map { entry =>
            toEntry(entry, configured.get(entry.birdType))
          }
        DirectorBirdSkillBoard(birds = birds)
      }
    }

  private def toEntry(entry: DirectorCatalogEntry, config: Option[BirdSkillConfig]): DirectorBirdSkillEntry =
    DirectorBirdSkillEntry(
      birdType = entry.birdType,
      name = entry.name,
      source = entry.source,
      authorId = entry.authorId,
      skillName = entry.skillName,
      tierSkillDescriptions = entry.tierSkillDescriptions,
      configured = config.isDefined,
      skills = config.map(_.skills),
      modelImageUrl = config.flatMap(_.modelImageUrl).orElse(Some(entry.previewImageUrl))
    )
}
