package microservice.admin.director.api

import cats.effect.IO
import java.sql.Connection
import microservice.admin.director.objects.DirectorPermissionSummary
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.core.{AccessControl}
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

