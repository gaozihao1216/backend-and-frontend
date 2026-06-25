package microservice.bird.api.design

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.user.support.AccessControl
import microservice.bird.objects.submission.BirdSubmission
import microservice.bird.tables.design.BirdDesignTable
import microservice.bird.tables.submission.{BirdSubmissionRow, BirdSubmissionTable}
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.{LevelStatus, SubmissionStatus, UserRole}

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
    * 关联的前端 API：前端同名 API 文件。
    */

  override def plan(connection: Connection): IO[Either[HttpError, BirdSubmission]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Designer
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：确认设计处于可提交状态且无重复待审投稿
        _ <- requireSubmittable(connection)
        // 步骤 3：更新设计状态并创建 BirdSubmission 记录
        submission <- requireSubmitResult(connection)
      } yield submission
    }

  private def requireSubmittable(connection: Connection): microservice.infrastructure.api.PlanStep.Step[Unit] =
    EitherT.liftF(IO(BirdDesignTable.findById(connection, designId))).flatMap {
      case None =>
        EitherT.leftT[IO, Unit](HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(design) if design.authorId != designerId =>
        EitherT.leftT[IO, Unit](HttpError.forbidden("Cannot submit another designer's bird design"))
      case Some(_) if BirdSubmissionTable.hasPendingForDesign(connection, designId) =>
        EitherT.leftT[IO, Unit](HttpError.conflict("SUBMISSION_EXISTS", "Bird design already has a pending submission"))
      case Some(design) if design.status != LevelStatus.Draft && design.status != LevelStatus.Rejected =>
        EitherT.leftT[IO, Unit](
          HttpError.conflict("INVALID_BIRD_STATUS", "Bird design cannot be submitted in current status")
        )
      case Some(_) =>
        EitherT.rightT[IO, HttpError](())
    }

  private def requireSubmitResult(connection: Connection): microservice.infrastructure.api.PlanStep.Step[BirdSubmission] = {
    val timestamp = Instant.now().toString
    EitherT.liftF(
      IO(
        BirdDesignTable.updateSubmissionStatus(
          connection,
          designId,
          LevelStatus.PendingReview,
          None,
          timestamp
        )
      )
    ).flatMap {
      case None =>
        EitherT.leftT[IO, BirdSubmission](HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not enter review"))
      case Some(_) =>
        EitherT.rightT[IO, HttpError] {
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
          BirdSubmissionTable.toBirdSubmission(row)
        }
    }
  }
}
