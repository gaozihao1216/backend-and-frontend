package microservice.bird.api.internal.director

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.objects.skill.director.DirectorBirdSkillEntry
import microservice.bird.support.catalog.{BirdCatalogReadSupport, DirectorCatalogEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：单鸟种技能配置详情；由 admin HTTP API 调用，不挂路由。 */
final case class GetDirectorBirdSkillInternalAPIMessage(birdType: String) extends APIMessage[DirectorBirdSkillEntry] {
  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillEntry]] =
    PlanSteps.finish {
      EitherT.liftF(IO(BirdCatalogReadSupport.listDirectorCatalogEntries(connection).find(_.birdType == birdType))).flatMap {
        case None =>
          EitherT.leftT[IO, DirectorBirdSkillEntry](HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
        case Some(entry) =>
          EitherT.rightT[IO, HttpError](toEntry(entry, BirdSkillConfigTable.findByBirdType(connection, birdType)))
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
