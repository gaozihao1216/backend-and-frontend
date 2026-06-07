package microservice.bird.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.utils.AccessControl
import microservice.bird.objects.BirdDesign
import microservice.bird.tables.{BirdDesignTable, BirdRowMapper}
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.{LevelStatus, UserRole}

final case class ListBirdDesignsAPIMessage(
  designerId: String,
  status: Option[LevelStatus]
) extends APIWithTokenMessage[List[BirdDesign]] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, List[BirdDesign]]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).map { _ =>
        BirdDesignTable
          .listByAuthor(connection, designerId, status)
          .map(BirdRowMapper.toBirdDesign)
          .toList
      }
    }
}

final case class DeleteBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).flatMap { _ =>
        BirdDesignTable.findById(connection, designId) match {
          case None =>
            Left(HttpError.notFound("BIRD_DESIGN_NOT_FOUND", s"Bird design not found: $designId"))
          case Some(existing) if existing.authorId != designerId =>
            Left(HttpError.forbidden("Cannot delete another designer's bird design"))
          case Some(existing) if existing.status != LevelStatus.Draft =>
            Left(HttpError.conflict("INVALID_BIRD_STATUS", "Only draft designs can be deleted"))
          case Some(existing) =>
            if (BirdDesignTable.deleteDraft(connection, designId, designerId)) {
              Right(BirdRowMapper.toBirdDesign(existing))
            } else {
              Left(HttpError.conflict("INVALID_BIRD_STATUS", "Bird design could not be deleted"))
            }
        }
      }
    }
}
