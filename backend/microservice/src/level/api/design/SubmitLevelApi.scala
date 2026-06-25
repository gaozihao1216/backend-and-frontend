package microservice.level.api.design

import cats.effect.IO
import cats.data.EitherT
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanStep, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.support.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.submission.Submission
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.{LevelRow, SubmissionRow}
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.enums.{LevelStatus, SubmissionStatus, UserRole}
import microservice.level.objects.design.request.SubmitLevelRequest

/** 设计师提交关卡审核 APIMessage。 */
final case class SubmitLevelAPIMessage(
  designerId: String,
  body: SubmitLevelRequest
) extends APIWithTokenMessage[Submission] {
  override def token: String = designerId

  /** plan 定义了什么业务流程：Designer 将 Draft/Rejected 关卡提交审核，创建 Submission 记录。
    *
    * 关联的前端 API：POST /designer/submissions；前端 `SubmitLevelApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Submission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Designer
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：加载关卡并确认处于可提交状态
        level <- requireLevel(connection, body.levelId)
        // 步骤 3：校验作者身份与关卡状态允许提交
        _ <- requireSubmittable(connection, designerId, level)
        // 步骤 4：更新 Level 为 PendingReview 并插入 SubmissionRow
        submission <- PlanSteps.read {
          val timestamp = Instant.now().toString
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

  private def requireLevel(connection: Connection, levelId: String): PlanStep.Step[LevelRow] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId))).flatMap {
      case None      => EitherT.leftT(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
      case Some(row) => EitherT.rightT(row)
    }

  private def requireSubmittable(connection: Connection, designerId: String, level: LevelRow): PlanStep.Step[Unit] =
    if (level.authorId != designerId) {
      PlanStep.fail(HttpError.forbidden("Cannot submit another designer's level"))
    } else if (SubmissionTable.hasPendingForLevel(connection, level.id)) {
      PlanStep.fail(HttpError.conflict("SUBMISSION_EXISTS", "Level already has a pending submission"))
    } else if (level.status != LevelStatus.Draft && level.status != LevelStatus.Rejected) {
      PlanStep.fail(HttpError.conflict("INVALID_LEVEL_STATUS", "Level cannot be submitted in current status"))
    } else {
      PlanStep.succeed(())
    }
}
