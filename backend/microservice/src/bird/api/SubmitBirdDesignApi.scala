package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.BirdSubmission
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper, BirdSubmissionRow}
import microservice.bird.tables.submission.{BirdSubmissionTable}
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, SubmissionStatus, UserRole}

/** 将 Draft/Rejected 设计提交审核：设计进入 PendingReview，并创建 BirdSubmission 记录。
  *
  * 实现：校验所有权、无重复 pending 投稿、状态可提交 → updateSubmissionStatus + BirdSubmissionTable.insert。
  * 关联：POST /designer/bird-designs/:designId/submit；审核由 ReviewBirdSubmissionAPIMessage 处理。
  */
final case class SubmitBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdSubmission] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdSubmission]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).flatMap { _ =>
        BirdDesignTable.findById(connection, designId) match {
          case None =>
            Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
          case Some(design) if design.authorId != designerId =>
            Left(HttpError.forbidden("Cannot submit another designer's bird design"))
          case Some(design) if BirdSubmissionTable.hasPendingForDesign(connection, designId) =>
            Left(HttpError.conflict("SUBMISSION_EXISTS", "Bird design already has a pending submission"))
          case Some(design)
              if design.status != LevelStatus.Draft && design.status != LevelStatus.Rejected =>
            Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design cannot be submitted in current status"))
          case Some(_) =>
            val timestamp = Instant.now().toString
            BirdDesignTable.updateSubmissionStatus(
              connection,
              designId,
              LevelStatus.PendingReview,
              None,
              timestamp
            ) match {
              case None =>
                Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not enter review"))
              case Some(_) =>
                val row = BirdSubmissionTable.insert(
                  connection,
                  BirdSubmissionRow(
                    id = BirdSubmissionTable.nextId(connection),
                    birdDesignId = designId,
                    submitterId = designerId,
                    status = SubmissionStatus.PendingReview,
                    reviewerId = None,
                    reviewNote = None,
                    submittedAt = timestamp,
                    reviewedAt = None
                  )
                )
                Right(BirdRowMapper.toBirdSubmission(row))
            }
        }
      }
    }
}
