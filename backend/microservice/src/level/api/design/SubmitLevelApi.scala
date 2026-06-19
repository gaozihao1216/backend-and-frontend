package microservice.level.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.{HttpError}
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.submission.Submission
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{SubmissionRow}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.{LevelStatus, SubmissionStatus}
import microservice.system.objects.UserRole

/** 设计师提交关卡审核 APIMessage。 */
final case class SubmitLevelAPIMessage(
  designerId: String,
  body: SubmitLevelBody
) extends APIWithTokenMessage[Submission] {
  override def token: String = designerId

  /** 设计师将 draft/rejected 关卡提交审核。
    *
    * 实现：校验关卡归属 → 无重复 pending submission → Level 置 PendingReview → 插入 SubmissionRow。
    * 关联：Admin ReviewSubmissionAPIMessage 处理后续批准/拒绝；与 CreateLevel 共同构成 UGC 主流程。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        level <- PlanSteps.require(
          LevelTable.findById(connection, body.levelId) match {
            case None =>
              Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: ${body.levelId}"))
            case Some(value) =>
              Right(value)
          }
        )
        _ <- PlanSteps.require(
          // 只能提交自己的关卡
          if (level.authorId != designerId) {
            Left(HttpError.forbidden("Cannot submit another designer's level"))
          // 同一关卡不允许存在多条 pending submission
          } else if (SubmissionTable.hasPendingForLevel(connection, body.levelId)) {
            Left(HttpError.conflict("SUBMISSION_EXISTS", "Level already has a pending submission"))
          // 仅 Draft 或 Rejected 状态可再次提交
          } else if (level.status != LevelStatus.Draft && level.status != LevelStatus.Rejected) {
            Left(HttpError.conflict("INVALID_LEVEL_STATUS", "Level cannot be submitted in current status"))
          } else {
            Right(())
          }
        )
        submission <- PlanSteps.read {
          val timestamp = Instant.now().toString
          // 关卡与 submission 双写：level.status 与 submission.status 保持同步
          LevelTable.updateSubmissionStatus(connection, body.levelId, LevelStatus.PendingReview, None, timestamp)
          val row = SubmissionTable.insert(
            connection,
            SubmissionRow(
              id = SubmissionTable.nextId(connection),
              levelId = body.levelId,
              submitterId = designerId,
              status = SubmissionStatus.PendingReview,
              reviewerId = None,
              reviewNote = None,
              submittedAt = timestamp,
              reviewedAt = None
            )
          )
          LevelRowMapper.toSubmission(row)
        }
      } yield submission
    }
}
