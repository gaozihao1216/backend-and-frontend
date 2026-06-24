package microservice.level.support.design

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRow
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.LevelStatus

/** 设计师关卡设计访问控制：查存在、所有权与可提交状态校验。 */
private[level] object LevelDesignAccess {
  /** 按 levelId 查找关卡 Row，不存在返回 LEVEL_NOT_FOUND。 */
  def requireLevel(connection: Connection, levelId: String): Step[LevelRow] =
    EitherT.liftF(IO(LevelTable.findById(connection, levelId))).flatMap {
      case None    => EitherT.leftT(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
      case Some(row) => EitherT.rightT(row)
    }

  /** 校验设计师本人、无待审投稿、状态为 Draft 或 Rejected。 */
  def requireSubmittable(connection: Connection, designerId: String, level: LevelRow): Step[Unit] =
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
