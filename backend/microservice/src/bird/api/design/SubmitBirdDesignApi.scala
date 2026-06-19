package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.bird.objects.submission.BirdSubmission
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper, BirdSubmissionRow}
import microservice.bird.tables.submission.{BirdSubmissionTable}
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
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
  /** plan 定义了什么业务流程：SubmitBirdDesign 对应的业务流程。
    *
    * 解决了什么问题：封装该 API 的业务规则与数据访问。
    * 在事务内起到什么作用：在 DatabaseSession 事务内执行；Left 时回滚。
    * 关联的 HTTP 路由/前端 API：见 routes 中对应路径；前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, BirdSubmission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验用户角色/管理员级别权限
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        // 步骤 2：执行业务步骤
        _ <- PlanSteps.require(
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
              Right(())
          }
        )
        // 步骤 3：执行业务步骤
        submission <- PlanSteps.require(
          {
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
        )
      // 返回业务结果 DTO/领域对象
      } yield submission
    }
}
