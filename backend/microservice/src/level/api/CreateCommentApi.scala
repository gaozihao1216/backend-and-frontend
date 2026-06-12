package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.shared.CommentRow
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class CreateCommentBody(
  content: String
)

object CreateCommentBody {
  implicit val encoder: Encoder[CreateCommentBody] = deriveEncoder
  implicit val decoder: Decoder[CreateCommentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateCommentBody] = jsonOf
}

final case class CreateCommentAPIMessage(
  playerId: String,
  levelId: String,
  body: CreateCommentBody
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ()))
        _ <- PlanSteps.require(LevelApiSupport.publishedLevel(connection, levelId).map(_ => ()))
        comment <- PlanSteps.read(
          LevelRowMapper.toComment(
            CommentTable.insert(
              connection,
              CommentRow(
                id = CommentTable.nextId(connection),
                levelId = levelId,
                userId = playerId,
                content = body.content.trim,
                createdAt = Instant.now().toString
              )
            )
          )
        )
      } yield comment
    }
}
