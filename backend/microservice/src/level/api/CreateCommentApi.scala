package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.LevelComment
import microservice.level.tables.{CommentRow, CommentTable}
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
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).map { _ =>
        val row = CommentTable.insert(
          connection,
          CommentRow(
            id = CommentTable.nextId(connection),
            levelId = levelId,
            userId = playerId,
            content = body.content.trim,
            createdAt = Instant.now().toString
          )
        )
        RowMappers.toComment(row)
      })
    )
}

