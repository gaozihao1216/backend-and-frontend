package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.admin.objects.{
  AssignLevelSlotErrors,
  DirectorBirdPoolOption,
  DirectorLevelAssignmentBoard,
  LevelSlotAssignment,
  LevelSlotAssignmentDetail,
  LevelSlotCatalog
}
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
import microservice.player.preparation.BirdPreparationCatalog
import microservice.level.objects.{BirdPool, SubmissionWithLevel}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelRowMapper, LevelSlotAssignmentRow}
import microservice.level.tables.slot_assignment.{LevelSlotAssignmentTable}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

/** 总监关卡槽位分配的共享辅助逻辑：组装看板数据、关联投稿与关卡、构建可选 bird pool。
  *
  * 实现：buildBoard 合并已分配槽位、待分配已批准投稿、系统+设计师 bird pool 选项。
  * 关联：GetDirectorLevelAssignmentBoardAPIMessage 及 Assign/Unassign/UpdateBirdPool 均依赖此对象。
  */
object DirectorLevelAssignmentSupport {
  /** 按 submissionId 联查 SubmissionTable 与 LevelTable，返回 SubmissionWithLevel。 */
  def submissionWithLevel(connection: Connection, submissionId: String): Option[SubmissionWithLevel] =
    SubmissionTable.findById(connection, submissionId).flatMap { submission =>
      LevelTable.findById(connection, submission.levelId).map { level =>
        SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
      }
    }

  /** 合并系统内置鸟（BirdPreparationCatalog）与已发布设计师鸟（BirdDesignTable.listPublished）。 */
  def buildBirdPoolOptions(connection: Connection): List[DirectorBirdPoolOption] = {
    val systemOptions =
      BirdPreparationCatalog.entries.map { entry =>
        DirectorBirdPoolOption(
          birdType = entry.birdType,
          name = entry.name,
          source = "system",
          authorId = None
        )
      }.toList

    val designerOptions =
      BirdDesignTable
        .listPublished(connection)
        .map(BirdRowMapper.toBirdDesign)
        .map { design =>
          DirectorBirdPoolOption(
            birdType = design.id,
            name = design.name,
            source = "designer",
            authorId = Some(design.authorId)
          )
        }
        .toList

    systemOptions ++ designerOptions
  }

  /** 构建总监关卡分配看板：当前槽位占用、可分配投稿、bird pool 下拉选项。 */
  def buildBoard(connection: Connection): DirectorLevelAssignmentBoard = {
    val assignedSubmissionIds =
      LevelSlotAssignmentTable.listAll(connection).map(_.submissionId).toSet

    val assignments =
      LevelSlotAssignmentTable.listAll(connection).flatMap { row =>
        submissionWithLevel(connection, row.submissionId).map { submission =>
          LevelSlotAssignmentDetail(LevelSlotAssignment.from(row), submission)
        }
      }.toList

    val pendingApproved =
      SubmissionTable.listApproved(connection)
        .filterNot(submission => assignedSubmissionIds.contains(submission.id))
        .flatMap(submission =>
          LevelTable.findById(connection, submission.levelId).map { level =>
            SubmissionWithLevel.from(LevelRowMapper.toSubmission(submission), LevelRowMapper.toLevel(level))
          }
        )
        .toList

    DirectorLevelAssignmentBoard(
      assignments = assignments,
      pendingApproved = pendingApproved,
      birdPoolOptions = buildBirdPoolOptions(connection)
    )
  }
}

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

/** 将已批准关卡投稿分配到指定槽位（level01–level10），可附带 bird pool 配置。 */
final case class AssignLevelSlotBody(
  submissionId: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)

object AssignLevelSlotBody {
  import io.circe.generic.semiauto._
  import io.circe.{Decoder, Encoder}
  import org.http4s.EntityDecoder
  import org.http4s.circe.jsonOf

  implicit val encoder: Encoder[AssignLevelSlotBody] = deriveEncoder
  implicit val decoder: Decoder[AssignLevelSlotBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AssignLevelSlotBody] = jsonOf
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

/** 更新已分配槽位的 bird pool（玩家备战可选鸟列表）。 */
final case class UpdateLevelSlotBirdPoolBody(
  birdPool: BirdPool
)

object UpdateLevelSlotBirdPoolBody {
  import io.circe.generic.semiauto._
  import io.circe.{Decoder, Encoder}
  import org.http4s.EntityDecoder
  import org.http4s.circe.jsonOf

  implicit val encoder: Encoder[UpdateLevelSlotBirdPoolBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateLevelSlotBirdPoolBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateLevelSlotBirdPoolBody] = jsonOf
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

/** 废止已批准投稿：解除槽位绑定、Submission 标记 Abolished、Level 回退为 Rejected。 */
final case class AbolishDirectorSubmissionBody(
  note: Option[String]
)

object AbolishDirectorSubmissionBody {
  import io.circe.generic.semiauto._
  import io.circe.{Decoder, Encoder}
  import org.http4s.EntityDecoder
  import org.http4s.circe.jsonOf

  implicit val encoder: Encoder[AbolishDirectorSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[AbolishDirectorSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, AbolishDirectorSubmissionBody] = jsonOf
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
