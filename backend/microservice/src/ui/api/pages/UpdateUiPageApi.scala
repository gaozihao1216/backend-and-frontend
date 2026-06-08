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
import microservice.ui.tables.{UiPageRowMapper, UiPageTable}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class UpdateUiPageBody(
  page: PageConfig
)

object UpdateUiPageBody {
  implicit val encoder: Encoder[UpdateUiPageBody] = deriveEncoder
  implicit val decoder: Decoder[UpdateUiPageBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdateUiPageBody] = jsonOf
}

final case class UpdateUiPageAPIMessage(
  userId: String,
  pageId: String,
  body: UpdateUiPageBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        if (body.page.name.trim.isEmpty || body.page.path.trim.isEmpty) {
          Left(UiCustomizationErrors.InvalidPageConfig("name and path are required").toHttpError)
        } else {
          val updatedConfig = body.page.copy(
            id = pageId,
            name = body.page.name.trim,
            path = body.page.path.trim
          )

          UiPageTable.findById(connection, pageId) match {
            case None =>
              val timestamp = Instant.now().toString
              val inserted = UiPageTable.insert(
                connection,
                UiPageRowMapper.fromPageConfig(
                  updatedConfig,
                  createdAt = timestamp,
                  updatedAt = timestamp
                )
              )
              Right(UiPageRowMapper.toPageConfig(inserted))
            case Some(existing) =>
              UiPageTable
                .update(
                  connection,
                  UiPageRowMapper.fromPageConfig(
                    updatedConfig,
                    createdAt = existing.createdAt,
                    updatedAt = Instant.now().toString
                  )
                )
                .map(row => Right(UiPageRowMapper.toPageConfig(row)))
                .getOrElse(Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError))
          }
        }
      }
    }
}
