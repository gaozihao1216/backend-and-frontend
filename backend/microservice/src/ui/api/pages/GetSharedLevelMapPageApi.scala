package microservice.ui.api.pages

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.{UiPageRowMapper, UiPageTable}

object SharedLevelMapPageId {
  val value: String = "shared.levelMap"
}

final case class GetSharedLevelMapPageAPIMessage(
  userId: String
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case None =>
          Left(HttpError.unauthorized("Unknown user"))
        case Some(_) =>
          UiPageTable.findById(connection, SharedLevelMapPageId.value)
            .map(UiPageRowMapper.toPageConfig)
            .toRight(UiCustomizationErrors.PageNotFound(SharedLevelMapPageId.value).toHttpError)
      }
    }
}
