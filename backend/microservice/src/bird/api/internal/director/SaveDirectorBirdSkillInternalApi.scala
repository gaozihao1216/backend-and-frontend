package microservice.bird.api.internal.director

import cats.effect.IO
import java.sql.Connection
import io.circe.Json
import microservice.bird.objects.skill.config.BirdSkillConfig
import microservice.bird.support.catalog.BirdCatalogReadSupport
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError

/** 模块间 API：保存鸟种技能配置；由 admin HTTP API 调用，不挂路由。 */
final case class SaveDirectorBirdSkillInternalAPIMessage(
  userId: String,
  birdType: String,
  skills: Json,
  modelImageUrl: Option[String]
) extends APIMessage[BirdSkillConfig] {
  override def plan(connection: Connection): IO[Either[HttpError, BirdSkillConfig]] =
    PlanSteps.finish {
      for {
        _ <- requireKnownBird(connection)
        validated <- requireSkillsJson
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
    }

  private def requireKnownBird(connection: Connection): cats.data.EitherT[IO, HttpError, Unit] =
    if (BirdCatalogReadSupport.listDirectorCatalogEntries(connection).exists(_.birdType == birdType)) {
      PlanSteps.accept(())
    } else {
      PlanSteps.reject(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
    }

  private def requireSkillsJson: cats.data.EitherT[IO, HttpError, Json] =
    skills.hcursor.downField("stages").focus match {
      case None =>
        PlanSteps.reject(HttpError.badRequest("INVALID_SKILLS", "skills.stages is required"))
      case Some(stages) if !stages.isArray =>
        PlanSteps.reject(HttpError.badRequest("INVALID_SKILLS", "skills.stages must be an array"))
      case Some(stages) if stages.asArray.exists(_.isEmpty) =>
        PlanSteps.reject(HttpError.badRequest("INVALID_SKILLS", "skills.stages must not be empty"))
      case _ =>
        PlanSteps.accept(skills)
    }
}
