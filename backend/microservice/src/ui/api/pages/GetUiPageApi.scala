package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

final case class GetUiPageAPIMessage(
  userId: String,
  pageId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        UiPageTable.findById(connection, pageId)
          .map(UiPageRowMapper.toPageConfig)
          .toRight(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      }
    }
}
