package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.BirdDesign
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.shared.{BirdRowMapper}
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}

/** 列出当前设计师的鸟类设计，可按 LevelStatus 筛选。
  *
  * 关联：GET /designer/bird-designs?status=。
  */
final case class ListBirdDesignsAPIMessage(
  designerId: String,
  status: Option[LevelStatus]
) extends APIWithTokenMessage[List[BirdDesign]] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, List[BirdDesign]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        designs <- PlanSteps.read(
          BirdDesignTable
            .listByAuthor(connection, designerId, status)
            .map(BirdRowMapper.toBirdDesign)
            .toList
        )
      } yield designs
    }
}

/** 删除草稿状态的鸟类设计（仅作者、仅 Draft）。
  *
  * 关联：DELETE /designer/bird-designs/:designId。
  */
final case class DeleteBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ()))
        existing <- PlanSteps.require(
          BirdDesignTable.findById(connection, designId) match {
            case None =>
              Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
            case Some(row) if row.authorId != designerId =>
              Left(HttpError.forbidden("Cannot delete another designer's bird design"))
            case Some(row) if row.status != LevelStatus.Draft =>
              Left(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft designs can be deleted"))
            case Some(row) =>
              Right(row)
          }
        )
        design <- PlanSteps.require(
          if (BirdDesignTable.deleteDraft(connection, designId, designerId)) {
            Right(BirdRowMapper.toBirdDesign(existing))
          } else {
            Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be deleted"))
          }
        )
      } yield design
    }
}
