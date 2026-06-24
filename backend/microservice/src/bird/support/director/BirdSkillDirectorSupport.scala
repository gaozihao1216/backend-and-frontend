package microservice.bird.support.director

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import io.circe.Json
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.objects.skill.director.{DirectorBirdSkillBoard, DirectorBirdSkillEntry}
import microservice.bird.support.catalog.{BirdCatalogReadSupport, DirectorCatalogEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError

/** 总监鸟类技能配置的 bird 模块内实现。 */
private[bird] object BirdSkillDirectorSupport {
  def buildBoard(connection: Connection): DirectorBirdSkillBoard = {
    val configured = BirdSkillConfigTable.skillsJsonMap(connection)
    val birds =
      BirdCatalogReadSupport.listDirectorCatalogEntries(connection).map { entry =>
        toEntry(entry, configured.get(entry.birdType))
      }
    DirectorBirdSkillBoard(birds = birds)
  }

  def requireEntry(connection: Connection, birdType: String): Step[DirectorBirdSkillEntry] =
    EitherT.liftF(IO(BirdCatalogReadSupport.listDirectorCatalogEntries(connection).find(_.birdType == birdType))).flatMap {
      case None =>
        EitherT.leftT(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
      case Some(entry) =>
        EitherT.rightT(toEntry(entry, BirdSkillConfigTable.findByBirdType(connection, birdType)))
    }

  def requireSaveConfig(
    connection: Connection,
    userId: String,
    birdType: String,
    skills: Json,
    modelImageUrl: Option[String]
  ): Step[BirdSkillConfig] =
    for {
      _ <-
        if (BirdCatalogReadSupport.listDirectorCatalogEntries(connection).exists(_.birdType == birdType)) {
          PlanStep.succeed(())
        } else {
          PlanStep.fail(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
        }
      validated <- requireSkillsJson(skills)
    } yield BirdSkillConfigTable.upsert(
      connection,
      BirdSkillConfig(
        birdType = birdType,
        skills = validated,
        modelImageUrl = modelImageUrl.filter(_.trim.nonEmpty),
        updatedById = Some(userId),
        updatedAt = BirdSkillConfigTable.nowIso
      )
    )

  def requireSkillsJson(skills: Json): Step[Json] =
    skills.hcursor.downField("stages").focus match {
      case None =>
        PlanStep.fail(HttpError.badRequest("INVALID_SKILLS", "skills.stages is required"))
      case Some(stages) if !stages.isArray =>
        PlanStep.fail(HttpError.badRequest("INVALID_SKILLS", "skills.stages must be an array"))
      case Some(stages) if stages.asArray.exists(_.isEmpty) =>
        PlanStep.fail(HttpError.badRequest("INVALID_SKILLS", "skills.stages must not be empty"))
      case _ =>
        PlanStep.succeed(skills)
    }

  private def toEntry(
    entry: DirectorCatalogEntry,
    config: Option[BirdSkillConfig]
  ): DirectorBirdSkillEntry =
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
