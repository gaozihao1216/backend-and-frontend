package microservice.admin.director.api

import cats.effect.IO
import java.sql.Connection
import microservice.admin.director.objects.DirectorPermissionSummary
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError}
import microservice.system.objects.AdminLevel

final case class GetDirectorPermissionsAPIMessage(
  userId: String
) extends APIWithTokenMessage[DirectorPermissionSummary] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, DirectorPermissionSummary]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map { user =>
        DirectorPermissionSummary(
          userId = user.id,
          adminLevel = AdminLevel.Director,
          canManageUiCustomization = true
        )
      }
    }
}

object GetDirectorPermissionsEndpoint {
  val name: String = "GetDirectorPermissions"
  val method: String = "GET"
  val path: String = "/admin/director/permissions"
  val businessLogic: String =
    "总监管理员权限探测接口，用于验证当前 admin 账号是否具备 director 权限。"
}
