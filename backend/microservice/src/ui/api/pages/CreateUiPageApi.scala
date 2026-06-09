package microservice.ui.api.pages

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.auth.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class CreateUiPageBody(
  page: PageConfig
)

object CreateUiPageBody {
  implicit val encoder: Encoder[CreateUiPageBody] = deriveEncoder
  implicit val decoder: Decoder[CreateUiPageBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateUiPageBody] = jsonOf
}

final case class CreateUiPageAPIMessage(
  userId: String,
  body: CreateUiPageBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        if (UiPageTable.findById(connection, body.page.id).nonEmpty) {
          Left(UiCustomizationErrors.PageAlreadyExists(body.page.id).toHttpError)
        } else if (body.page.id.trim.isEmpty || body.page.name.trim.isEmpty || body.page.path.trim.isEmpty) {
          Left(UiCustomizationErrors.InvalidPageConfig("id, name and path are required").toHttpError)
        } else {
          val timestamp = Instant.now().toString
          val row = UiPageTable.insert(
            connection,
            UiPageRowMapper.fromPageConfig(body.page.copy(
              id = body.page.id.trim,
              name = body.page.name.trim,
              path = body.page.path.trim
            ), createdAt = timestamp, updatedAt = timestamp)
          )
          Right(UiPageRowMapper.toPageConfig(row))
        }
      }
    }
}
