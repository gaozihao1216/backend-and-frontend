package microservice.level.support.design

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRow
import microservice.level.tables.submission.SubmissionTable
import microservice.system.objects.LevelStatus

/** 设计师关卡提交前的所有权与状态校验。 */
object LevelDesignAccess {
  def requireLevel(connection: Connection, levelId: String): Step[LevelRow] =
    PlanStep.fromEither(checkLevel(connection, levelId))

  def requireSubmittable(connection: Connection, designerId: String, level: LevelRow): Step[Unit] =
    PlanStep.fromEither(checkSubmittable(connection, designerId, level))

  def checkLevel(connection: Connection, levelId: String): Either[HttpError, LevelRow] =
    LevelTable.findById(connection, levelId) match {
      case None    => Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
      case Some(row) => Right(row)
    }

  def checkSubmittable(connection: Connection, designerId: String, level: LevelRow): Either[HttpError, Unit] =
    if (level.authorId != designerId) {
      Left(HttpError.forbidden("Cannot submit another designer's level"))
    } else if (SubmissionTable.hasPendingForLevel(connection, level.id)) {
      Left(HttpError.conflict("SUBMISSION_EXISTS", "Level already has a pending submission"))
    } else if (level.status != LevelStatus.Draft && level.status != LevelStatus.Rejected) {
      Left(HttpError.conflict("INVALID_LEVEL_STATUS", "Level cannot be submitted in current status"))
    } else {
      Right(())
    }
}
