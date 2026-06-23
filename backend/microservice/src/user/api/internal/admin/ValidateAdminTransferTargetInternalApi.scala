package microservice.user.api.internal.admin

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.support.admin.DirectorPermissionSupport

/** 模块间 API：校验总监权限移交目标；由 admin HTTP API 调用，不挂路由。 */
final case class ValidateAdminTransferTargetInternalAPIMessage(targetAdminId: String) extends APIMessage[Unit] {
  override def plan(connection: Connection): IO[Either[HttpError, Unit]] =
    PlanSteps.finish {
      DirectorPermissionSupport.requireValidateAdminTransferTarget(connection, targetAdminId)
    }
}
