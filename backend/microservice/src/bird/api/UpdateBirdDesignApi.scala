package microservice.bird.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.BirdDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class UpdateBirdDesignBody(
  name: String,
  summary: String,
  skillName: String,
  attack: Int,
  impact: Int,
  speed: Int,
  tierSkills: List[String],
  previewImageUrl: Option[String] = None,
  mechanismTags: List[String] = List.empty
)

object UpdateBirdDesignBody {
  implicit val encoder: Encoder[UpdateBirdDesignBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateBirdDesignBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateBirdDesignBody] = jsonOf
}

final case class UpdateBirdDesignAPIMessage(designerId: String, designId: String, body: UpdateBirdDesignBody)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).flatMap { _ =>
        BirdDesignTable.findById(connection, designId) match {
          case None =>
            Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
          case Some(existing) if existing.authorId != designerId =>
            Left(HttpError.forbidden("Cannot edit another designer's bird design"))
          case Some(existing) if existing.status != LevelStatus.Draft && existing.status != LevelStatus.Rejected =>
            Left(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft or rejected designs can be edited"))
          case Some(existing) =>
            BirdDesignValidation.validate(
              BirdDesignInputBody(
                name = body.name,
                summary = body.summary,
                skillName = body.skillName,
                attack = body.attack,
                impact = body.impact,
                speed = body.speed,
                tierSkills = body.tierSkills,
                previewImageUrl = body.previewImageUrl,
                mechanismTags = body.mechanismTags
              )
            ).flatMap { input =>
              val timestamp = Instant.now().toString
              val updatedRow = existing.copy(
                name = input.name,
                summary = input.summary,
                skillName = input.skillName,
                attack = input.attack,
                impact = input.impact,
                speed = input.speed,
                tierSkillsJson = BirdRowMapper.encodeStringList(input.tierSkills),
                previewImageUrl = input.previewImageUrl.filter(_.trim.nonEmpty).map(_.trim).getOrElse(existing.previewImageUrl),
                mechanismTagsJson = BirdRowMapper.encodeStringList(input.mechanismTags),
                status = LevelStatus.Draft,
                rejectionReason = None,
                updatedAt = timestamp
              )
              BirdDesignTable.updateEditable(connection, updatedRow) match {
                case None => Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be updated"))
                case Some(row) => Right(BirdRowMapper.toBirdDesign(row))
              }
            }
        }
      }
    }
}
