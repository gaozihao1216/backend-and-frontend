package microservice.ui.api.pagecomponents

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import java.time.Instant
import microservice.user.utils.AccessControl
import microservice.infrastructure.api.APIWithTokenMessage
import microservice.infrastructure.http.HttpError
import microservice.system.objects.AdminLevel
import microservice.ui.objects.{PageComponent, PageConfig, UiCustomizationErrors}
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class UpdatePageComponentBody(
  component: PageComponent
)

object UpdatePageComponentBody {
  implicit val encoder: Encoder[UpdatePageComponentBody] = deriveEncoder
  implicit val decoder: Decoder[UpdatePageComponentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, UpdatePageComponentBody] = jsonOf
}

final case class UpdatePageComponentAPIMessage(
  userId: String,
  pageId: String,
  componentId: String,
  body: UpdatePageComponentBody
) extends APIWithTokenMessage[PageConfig] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, PageConfig]] =
    IO.pure {
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).flatMap { _ =>
        UiPageTable.findById(connection, pageId) match {
          case None =>
            Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
          case Some(page) if !page.components.exists(_.id == componentId) =>
            Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
          case Some(_) =>
            val component = body.component match {
              case button: microservice.ui.objects.ButtonComponent => button.copy(id = componentId)
              case panel: microservice.ui.objects.PanelComponent => panel.copy(id = componentId)
              case text: microservice.ui.objects.TextComponent => text.copy(id = componentId)
              case list: microservice.ui.objects.ListComponent => list.copy(id = componentId)
            }
            UiPageTable
              .updateComponent(connection, pageId, componentId, component, Instant.now().toString)
              .map(row => Right(UiPageRowMapper.toPageConfig(row)))
              .getOrElse(Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError))
        }
      }
    }
}
