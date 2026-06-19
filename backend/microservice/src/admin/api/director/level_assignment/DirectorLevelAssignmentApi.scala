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
import microservice.level.objects.inventory.{BirdPool}
import microservice.level.objects.submission.{SubmissionWithLevel}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelSlotAssignmentRow}
import microservice.level.tables.slot_assignment.{LevelSlotAssignmentTable}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.system.objects.{AdminLevel, LevelStatus, SubmissionStatus}

/** 获取总监关卡槽位分配看板 APIMessage。 */
final case class GetDirectorLevelAssignmentBoardAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorLevelAssignmentBoard] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 拉取已分配槽位、待分配 Approved 投稿及 bird pool 选项。
    *
    * 解决了什么问题：总监需在一屏内管理 level01–level10 槽位与可选鸟配置。
    * 在事务内起到什么作用：只读组装看板数据；委托 DirectorLevelAssignmentSupport.buildBoard。
    * 关联的 HTTP 路由/前端 API：GET /admin/director/level-assignments/board；前端 Director 关卡分配页。
    */
  override def plan(connection: Connection): IO[Either[HttpError, DirectorLevelAssignmentBoard]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 步骤 2：组装看板（已分配 + 待分配 + birdPoolOptions）
        board <- PlanSteps.read(DirectorLevelAssignmentSupport.buildBoard(connection))
      // 返回完整看板 DTO
      } yield board
    }
}

/** 分配关卡到槽位 APIMessage：校验 suffix 合法、投稿已 Approved，然后 upsert LevelSlotAssignmentTable。 */
final case class AssignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String,
  body: AssignLevelSlotBody
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  /** plan 定义了什么业务流程：将已批准投稿绑定到 level01–level10 某一槽位，可附带 bird pool。
    *
    * 解决了什么问题：玩家侧固定槽位需由总监指定 UGC 关卡与备战鸟池。
    * 在事务内起到什么作用：校验通过后 upsert LevelSlotAssignmentTable；失败则整笔回滚。
    * 关联的 HTTP 路由/前端 API：POST /admin/director/level-assignments/:levelSuffix。
    */
  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限并获取 user 记录（assignedById）
        user <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        // 步骤 2：校验 levelSuffix 在 LevelSlotCatalog 白名单内
        _ <- PlanSteps.require(
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        )
        // 步骤 3：加载投稿；不存在则 SUBMISSION_NOT_FOUND
        submission <- PlanSteps.require(
          SubmissionTable.findById(connection, body.submissionId).toRight(
            AssignLevelSlotErrors.SubmissionMissing(body.submissionId).toHttpError
          )
        )
        // 步骤 4：投稿须为 Approved 状态
        _ <- PlanSteps.require(
          if (submission.status == SubmissionStatus.Approved) Right(())
          else Left(AssignLevelSlotErrors.SubmissionNotApproved(body.submissionId).toHttpError)
        )
        // 步骤 5：关联 Level 须存在
        _ <- PlanSteps.require(
          LevelTable.findById(connection, submission.levelId).toRight(
            AssignLevelSlotErrors.LinkedLevelMissing(submission.levelId).toHttpError
          ).map(_ => ())
        )
        // 步骤 6：构造 LevelSlotAssignmentRow 并 upsert，返回 assignment + submissionWithLevel
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
      // 返回槽位分配详情（含投稿与关卡快照）
      } yield detail
    }
}

/** 解除指定槽位关卡分配 APIMessage（删除 LevelSlotAssignmentTable 记录）。 */
final case class UnassignLevelSlotAPIMessage(
  userId: String,
  levelSuffix: String
) extends APIWithTokenMessage[LevelSlotAssignment] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 清空某槽位的关卡绑定，保留槽位本身。
    *
    * 解决了什么问题：需临时下架某槽位 UGC 关卡而不废止投稿。
    * 在事务内起到什么作用：deleteBySuffix；记录不存在则 LEVEL_ASSIGNMENT_NOT_FOUND 回滚。
    * 关联的 HTTP 路由/前端 API：DELETE /admin/director/level-assignments/:levelSuffix。
    */
  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignment]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 步骤 2：校验 levelSuffix 合法
        _ <- PlanSteps.require(
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        )
        // 步骤 3：加载现有分配记录
        existing <- PlanSteps.require(
          LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix).toRight(
            AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError
          )
        )
        // 步骤 4：删除分配记录
        _ <- PlanSteps.require(
          if (LevelSlotAssignmentTable.deleteBySuffix(connection, levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError)
        )
      // 返回被删除的分配快照
      } yield LevelSlotAssignment.from(existing)
    }
}

/** 更新槽位 bird pool 配置 APIMessage，不改变 submission 绑定关系。 */
final case class UpdateLevelSlotBirdPoolAPIMessage(
  userId: String,
  levelSuffix: String,
  body: UpdateLevelSlotBirdPoolBody
) extends APIWithTokenMessage[LevelSlotAssignmentDetail] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 修改某槽位玩家备战可选鸟列表，不更换关卡。
    *
    * 解决了什么问题：同一 UGC 关卡可能需要调整可用鸟种而不重新分配投稿。
    * 在事务内起到什么作用：find + upsert LevelSlotAssignmentTable.birdPool 字段。
    * 关联的 HTTP 路由/前端 API：PUT /admin/director/level-assignments/:levelSuffix/bird-pool。
    */
  override def plan(connection: Connection): IO[Either[HttpError, LevelSlotAssignmentDetail]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ()))
        // 步骤 2：校验 levelSuffix 合法
        _ <- PlanSteps.require(
          if (LevelSlotCatalog.isSupported(levelSuffix)) Right(())
          else Left(AssignLevelSlotErrors.InvalidLevelSuffix(levelSuffix).toHttpError)
        )
        // 步骤 3：加载现有分配；不存在则 LEVEL_ASSIGNMENT_NOT_FOUND
        existing <- PlanSteps.require(
          LevelSlotAssignmentTable.findBySuffix(connection, levelSuffix).toRight(
            AssignLevelSlotErrors.AssignmentMissing(levelSuffix).toHttpError
          )
        )
        // 步骤 4：更新 birdPool 并 upsert，返回详情
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
      // 返回更新后的槽位分配详情
      } yield detail
    }
}

/** 总监废止已批准关卡 APIMessage：从槽位移除并同步更新 Submission 与 Level 状态。 */
final case class AbolishDirectorSubmissionAPIMessage(
  userId: String,
  submissionId: String,
  body: AbolishDirectorSubmissionBody
) extends APIWithTokenMessage[SubmissionWithLevel] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Director 废止已 Approved 投稿，解除槽位、标记 Abolished、Level 回退 Rejected。
    *
    * 解决了什么问题：已上线 UGC 关卡若违规需从玩家槽位下架并保留审计轨迹。
    * 在事务内起到什么作用：deleteBySubmissionId + updateReview(Submission) + updateReviewStatus(Level) 原子执行。
    * 关联的 HTTP 路由/前端 API：POST /admin/director/submissions/:submissionId/abolish。
    */
  override def plan(connection: Connection): IO[Either[HttpError, SubmissionWithLevel]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验 Director 权限
        user <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        // 步骤 2：加载投稿
        submission <- PlanSteps.require(
          SubmissionTable.findById(connection, submissionId).toRight(
            AssignLevelSlotErrors.SubmissionMissing(submissionId).toHttpError
          )
        )
        // 步骤 3：仅 Approved 投稿可废止
        _ <- PlanSteps.require(
          if (submission.status == SubmissionStatus.Approved) Right(())
          else Left(AssignLevelSlotErrors.SubmissionNotAbolishable(submissionId).toHttpError)
        )
        // 步骤 4：解除槽位、更新 Submission 为 Abolished、Level 为 Rejected
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
      // 返回废止后的投稿+关卡快照
      } yield result
    }
}
