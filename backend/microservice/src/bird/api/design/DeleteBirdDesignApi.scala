package microservice.bird.api.design

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.user.support.AccessControl
import microservice.bird.objects.design.BirdDesign
import microservice.bird.tables.design.{BirdDesignRow, BirdDesignTable}
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.enums.{LevelStatus, UserRole}

/** DELETE /designer/bird-designs/:designId — 删除草稿状态的鸟类设计（仅作者、仅 Draft）。 */
final case class DeleteBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  /** plan 定义了什么业务流程：Designer 删除自己名下 Draft 状态的鸟类设计。
    *
    * 关联的前端 API：DELETE /designer/bird-designs/:designId；前端 `DeleteBirdDesignApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Designer
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        // 步骤 2：确认设计可删除（作者匹配且为 Draft）
        existing <- requireDeletable(connection)
        // 步骤 3：执行删除并返回被删设计快照
        design <- requireDeleteResult(connection, existing)
      } yield design
    }

  private def requireDeletable(connection: Connection): microservice.infrastructure.api.PlanStep.Step[BirdDesignRow] =
    EitherT.liftF(IO(BirdDesignTable.findById(connection, designId))).flatMap {
      case None =>
        EitherT.leftT[IO, BirdDesignRow](HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
      case Some(row) if row.authorId != designerId =>
        EitherT.leftT[IO, BirdDesignRow](HttpError.forbidden("Cannot delete another designer's bird design"))
      case Some(row) if row.status != LevelStatus.Draft =>
        EitherT.leftT[IO, BirdDesignRow](HttpError.conflict("INVALID_BIRD_STATUS", "Only draft designs can be deleted"))
      case Some(row) =>
        EitherT.rightT[IO, HttpError](row)
    }

  private def requireDeleteResult(
    connection: Connection,
    existing: BirdDesignRow
  ): microservice.infrastructure.api.PlanStep.Step[BirdDesign] =
    EitherT.liftF(IO(BirdDesignTable.deleteDraft(connection, designId, designerId))).flatMap {
      case true =>
        EitherT.rightT[IO, HttpError](BirdDesignTable.toBirdDesign(existing))
      case false =>
        EitherT.leftT[IO, BirdDesign](HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be deleted"))
    }
}
