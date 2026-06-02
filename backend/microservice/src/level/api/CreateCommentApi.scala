package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
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

final case class CreateCommentRequest(
  playerId: String,
  levelId: String,
  content: String
)

final case class CreateCommentAPIMessage(
  token: String,
  levelId: String,
  body: CreateCommentBody
) extends APIWithTokenMessage[LevelComment] {
  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    IO.pure(
      AccessControl.requireRole(token, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(levelId).map { _ =>
        val row = CommentTable.insert(
          CommentRow(
            id = s"comment-${CommentTable.count + 1}",
            levelId = levelId,
            userId = token,
            content = body.content.trim,
            createdAt = "2026-05-26T13:30:00Z"
          )
        )
        RowMappers.toComment(row)
      })
    )
}

object CreateCommentEndpoint {
  val name: String = "CreateComment"
  val method: String = "POST"
  val path: String = "/player/levels/:levelId/comments"
  val businessLogic: String =
    "玩家只能给已发布关卡创建评论。"
}
