package microservice.bird.api.design

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.bird.objects.design.BirdDesign
import microservice.bird.support.design.BirdDesignAccess
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.system.objects.UserRole

/** DELETE /designer/bird-designs/:designId — 删除草稿状态的鸟类设计（仅作者、仅 Draft）。 */
final case class DeleteBirdDesignAPIMessage(designerId: String, designId: String)
    extends APIWithTokenMessage[BirdDesign] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, BirdDesign]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer).map(_ => ())
        existing <- BirdDesignAccess.requireDeletable(connection, designerId, designId)
        design <- BirdDesignAccess.requireDeleteResult(connection, designId, designerId, existing)
      } yield design
    }
}
