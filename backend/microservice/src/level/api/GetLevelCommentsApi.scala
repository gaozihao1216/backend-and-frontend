package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetLevelCommentsAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player)
        .flatMap(_ =>
          LevelApiSupport.publishedLevel(connection, levelId).map(_ =>
            CommentTable.listByLevel(connection, levelId).map(LevelRowMapper.toComment).toList
          )
        )
    )
}
