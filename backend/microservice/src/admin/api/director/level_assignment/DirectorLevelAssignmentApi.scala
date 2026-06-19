package microservice.admin.api.director.level_assignment

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.director.level_assignment.{
  AssignLevelSlotErrors,
  DirectorLevelAssignmentBoard,
  LevelSlotAssignment,
  LevelSlotAssignmentDetail,
  LevelSlotCatalog
}
import microservice.admin.support.director.level_assignment.DirectorLevelAssignmentSupport
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.level.objects.{BirdPool, SubmissionWithLevel}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelSlotAssignmentRow}
import microservice.level.tables.slot_assignment.{LevelSlotAssignmentTable}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

/** 获取总监关卡槽位分配看板（已分配 + 待分配 + bird pool 选项）。
  *
  * 实现：requireAdminLevel(Director) → DirectorLevelAssignmentSupport.buildBoard。
  * 关联：GET /admin/director/level-assignments/board。
  */
final case class GetDirectorLevelAssignmentBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorLevelAssignmentBoard] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorLevelAssignmentBoard]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        board <- PlanSteps.read(DirectorLevelAssignmentSupport.buildBoard(connection))
      } yield board
    }
}

/** 分配关卡到槽位：校验 suffix 合法、投稿已 Approved、关联 Level 存在，然后 upsert LevelSlotAssignmentTable。
  *
  * 关联：POST /admin/director/level-assignments/:levelSuffix；AssignLevelSlotErrors 定义错误。
  */
final case class AssignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String,
  body: AssignLevelSlotBody
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        user <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        _ <- PlanSteps.require(
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        )
        submission <- PlanSteps.require(
          SubmissionTable.findById(connection, body.submissionId).toRight(
            AssignLevelSlotErrors.SubmissionMissing(body.submissionId).toHttpError
          )
        )
        _ <- PlanSteps.require(
          if (submission.status == SubmissionStatus.Approved) Right(())
          else Left(AssignLevelSlotErrors.SubmissionNotApproved(body.submissionId).toHttpError)
        )
        _ <- PlanSteps.require(
          LevelTable.findById(connection, submission.levelId).toRight(
            AssignLevelSlotErrors.LinkedLevelMissing(submission.levelId).toHttpError
          ).map(_ => ())
        )
        detail <- PlanSteps.read {
          val timestamp = java.time.Instant.now().toString
          val row = LevelSlotAssignmentRow(
            id = LevelSlotAssignmentTable.nextId(connection),
            levelSuffix = levelSuffix,
            submissionId = submission.id,
            sourceLevelId = submission.levelId,
            assignedById = user.id,
            assignedAt = timestamp,
            note = body.note,
            birdPool = Some(body.birdPool.getOrElse(BirdPool.default))
          )
          LevelSlotAssignmentTable.upsert(connection, row)
          val submissionWithLevel =
            DirectorLevelAssignmentSupport
              .submissionWithLevel(connection, submission.id)
              .getOrElse(
                throw new IllegalStateException(s"Submission level missing after assign: ${submission.id}")
              )
          LevelSlotAssignmentDetail(LevelSlotAssignment.from(row), submissionWithLevel)
        }
      } yield detail
    }
}

/** 解除指定槽位的关卡分配（删除 LevelSlotAssignmentTable 记录）。 */
final case class UnassignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String
) extends APIWithTokenMessage[LevelSlotAssignment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignment]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        _ <- PlanSteps.require(
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        )
        existing <- PlanSteps.require(
          LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix).toRight(
            AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError
          )
        )
        _ <- PlanSteps.require(
          if (LevelSlotAssignmentTable.deleteBySuffix(connection, levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError)
        )
      } yield LevelSlotAssignment.from(existing)
    }
}

/** 更新槽位 bird pool 配置，不改变 submission 绑定关系。 */
final case class UpdateLevelSlotBirdPoolAPIMessage(
  userId: String,
  levelSuffix: String,
  body: UpdateLevelSlotBirdPoolBody
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        _ <- PlanSteps.require(
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        )
        existing <- PlanSteps.require(
          LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix).toRight(
            AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError
          )
        )
        detail <- PlanSteps.read {
          val updated = existing.copy(birdPool = Some(body.birdPool))
          LevelSlotAssignmentTable.upsert(connection, updated)
          val submissionWithLevel =
            DirectorLevelAssignmentSupport
              .submissionWithLevel(connection, updated.submissionId)
              .getOrElse(
                throw new IllegalStateException(s"Submission level missing after bird pool update: ${updated.submissionId}")
              )
          LevelSlotAssignmentDetail(LevelSlotAssignment.from(updated), submissionWithLevel)
        }
      } yield detail
    }
}

/** 总监废止已上线/已批准关卡：从槽位移除并同步更新 Submission 与 Level 状态。
  *
  * 关联：POST /admin/director/submissions/:submissionId/abolish。
  */
final case class AbolishDirectorSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: AbolishDirectorSubmissionBody
) extends APIWithTokenMessage[SubmissionWithLevel] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    PlanSteps.finish {
      for {
        user <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        submission <- PlanSteps.require(
          SubmissionTable.findById(connection, submissionId).toRight(
            AssignLevelSlotErrors.SubmissionMissing(submissionId).toHttpError
          )
        )
        _ <- PlanSteps.require(
          if (submission.status == SubmissionStatus.Approved) Right(())
          else Left(AssignLevelSlotErrors.SubmissionNotAbolishable(submissionId).toHttpError)
        )
        result <- PlanSteps.read {
          val timestamp = java.time.Instant.now().toString
          val abolishNote = body.note.filter(_.trim.nonEmpty).map(_.trim)

          LevelSlotAssignmentTable.deleteBySubmissionId(connection, submission.id)

          SubmissionTable.updateReview(
            connection = connection,
            submissionId = submission.id,
            status = SubmissionStatus.Abolished,
            reviewerId = user.id,
            reviewNote = abolishNote.orElse(Some("Abolished by director.")),
            reviewedAt = timestamp
          )

          LevelTable.updateReviewStatus(
            connection = connection,
            levelId = submission.levelId,
            status = LevelStatus.Rejected,
            rejectionReason = abolishNote.orElse(Some("Abolished by director.")),
            publishedAt = None,
            updatedAt = timestamp
          )

          DirectorLevelAssignmentSupport
            .submissionWithLevel(connection, submission.id)
            .getOrElse(throw new IllegalStateException(s"Submission missing after abolish: ${submission.id}"))
        }
      } yield result
    }
}
