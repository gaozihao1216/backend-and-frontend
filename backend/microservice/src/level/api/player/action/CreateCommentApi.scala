package microservice.level.api.player.action

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.support.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.{CommentRow, LevelRow}
import microservice.system.objects.enums.{LevelStatus, UserRole}
import microservice.level.objects.player.request.CreateLevelCommentRequest

final case class CreateCommentAPIMessage(
  playerId: String,
  levelId: String,
  body: CreateLevelCommentRequest
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = playerId
  /** plan 定义了什么业务流程：CreateComment 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的前端 API：前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- PlanSteps.fromEither(AccessControl.requireRole(connection, playerId, UserRole.Player))
        // 步骤 2：执行业务步骤
        _ <- requirePublishedLevel(connection).map(_ => ())
        // 步骤 3：读取并组装数据
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

  private def requirePublishedLevel(connection: Connection): cats.data.EitherT[IO, HttpError, LevelRow] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId))).flatMap {
      case Some(level) if level.status == LevelStatus.Published =>
        EitherT.rightT[IO, HttpError](level)
      case Some(_) =>
        EitherT.leftT[IO, LevelRow](HttpError.notFound("LEVEL_NOT_FOUND", "Published level not found"))
      case None =>
        EitherT.leftT[IO, LevelRow](HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
    }
}
