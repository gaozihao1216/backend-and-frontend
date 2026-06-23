package microservice.user.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.objects.handoff.DirectorAdminLevelTransferResult
import microservice.user.support.admin.DirectorPermissionSupport

/** 模块间 API：原子交换总监 adminLevel；由 admin HTTP API 调用，不挂路由。 */
final case class TransferDirectorAdminLevelInternalAPIMessage(
  currentDirectorId: String,
  targetAdminId: String
) extends APIMessage[DirectorAdminLevelTransferResult] {
  override def plan(connection: Connection): IO[Either[HttpError, DirectorAdminLevelTransferResult]] =
    PlanSteps.finish {
      DirectorPermissionSupport.requireTransferDirector(connection, currentDirectorId, targetAdminId)
    }
}
