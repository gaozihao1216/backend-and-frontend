package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.LevelComment
import microservice.level.tables.comment.{CommentTable}
import microservice.level.tables.shared.{CommentRow}
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /player/levels/:levelId/comments 的请求体。 */
final case class CreateCommentBody(
  content: String
)

object CreateCommentBody {
  implicit val encoder: Encoder[CreateCommentBody] = deriveEncoder
  implicit val decoder: Decoder[CreateCommentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateCommentBody] = jsonOf
}

/** 玩家对已发布关卡发表评论 APIMessage。 */
final case class CreateCommentAPIMessage(
  playerId: String,
  levelId: String,
  body: CreateCommentBody
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = playerId

  /** 玩家对已发布关卡发表评论。
    *
    * 实现：requireRole(Player) → 校验关卡已发布 → CommentTable.insert → RowMapper。
    * 关联：content 会 trim；userId 取自 header 中的 playerId。
    */
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
        LevelRowMapper.toComment(row)
      })
    )
}
