package microservice.admin.api

import cats.effect.IO
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto._
import io.circe.syntax._
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.{BirdSkillConfig, DirectorBirdSkillBoard, DirectorBirdSkillEntry}
import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.PlayerPreparationCatalog
import microservice.system.objects.AdminLevel
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf
import org.http4s.circe._

object DirectorBirdSkillSupport {
  def buildBoard(connection: Connection): DirectorBirdSkillBoard = {
    val configured = BirdSkillConfigTable.skillsJsonMap(connection)
    val birds =
      PlayerPreparationCatalog.loadEntries(connection).map { entry =>
        val config = configured.get(entry.birdType)
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
      }.toList
    DirectorBirdSkillBoard(birds = birds)
  }

  def validateSkillsJson(skills: Json): Either[HttpError, Json] =
    skills.hcursor.downField("stages").focus match {
      case None => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages is required"))
      case Some(stages) if !stages.isArray => Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must be an array"))
      case Some(stages) if stages.asArray.exists(_.isEmpty) =>
        Left(HttpError.badRequest("INVALID_SKILLS", "skills.stages must not be empty"))
      case _ => Right(skills)
    }
}

final case class GetDirectorBirdSkillBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorBirdSkillBoard] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillBoard]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map { _ =>
        DirectorBirdSkillSupport.buildBoard(connection)
      }
    }
}

final case class SaveDirectorBirdSkillBody(
  skills: Json,
  modelImageUrl: Option[String] = None
)

object SaveDirectorBirdSkillBody {
  implicit val encoder: Encoder[SaveDirectorBirdSkillBody] = deriveEncoder
  implicit val decoder: Decoder[SaveDirectorBirdSkillBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[cats.effect.IO, SaveDirectorBirdSkillBody] = jsonOf
}

final case class SaveDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String,
  body: SaveDirectorBirdSkillBody
) extends APIWithTokenMessage[BirdSkillConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, BirdSkillConfig]] =
    IO.pure {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        entry <- PlayerPreparationCatalog.find(connection, birdType).toRight(
          HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
        )
        skills <- DirectorBirdSkillSupport.validateSkillsJson(body.skills)
      } yield BirdSkillConfigTable.upsert(
          connection,
          BirdSkillConfig(
            birdType = birdType,
            skills = skills,
            modelImageUrl = body.modelImageUrl.filter(_.trim.nonEmpty),
            updatedById = Some(userId),
            updatedAt = BirdSkillConfigTable.nowIso
          )
        )
    }
}

final case class GetDirectorBirdSkillAPIMessage(
  userId: String,
  birdType: String
) extends APIWithTokenMessage[DirectorBirdSkillEntry] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorBirdSkillEntry]] =
    IO.pure {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
        entry <- PlayerPreparationCatalog.find(connection, birdType).toRight(
          HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType")
        )
      } yield {
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
    }
}
