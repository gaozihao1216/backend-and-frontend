package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.UserTable
import microservice.bird.objects.BirdSubmissionWithDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
import microservice.bird.tables.submission.{BirdSubmissionTable}
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.UserRole

/** 列出所有待审核的鸟类设计投稿，附带关联 BirdDesign 快照。
  *
  * 实现：校验 UserRole.Admin → BirdSubmissionTable.listPending → join BirdDesignTable。
  * 关联：GET /admin/bird-submissions/pending（AdminRouter 路由，APIMessage 在此模块）。
  */
final case class GetPendingBirdSubmissionsAPIMessage(userId: String)
    extends APIWithTokenMessage[List[BirdSubmissionWithDesign]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[BirdSubmissionWithDesign]]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          Right(
            BirdSubmissionTable
              .listPending(connection)
              .flatMap { submission =>
                BirdDesignTable.findById(connection, submission.birdDesignId).map { design =>
                  BirdSubmissionWithDesign.from(
                    BirdRowMapper.toBirdSubmission(submission),
                    BirdRowMapper.toBirdDesign(design)
                  )
                }
              }
              .toList
          )
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}
