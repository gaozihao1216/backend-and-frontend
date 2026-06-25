package microservice.ui.support.pagecomponents

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.component.PageComponent
import microservice.ui.objects.errors.UiCustomizationErrors
import microservice.ui.objects.page.PageConfig
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** 页面组件 CRUD 的查存在与写结果校验。 */
private[ui] object UiPageComponentAccess {
  def requirePageForNewComponent(
    connection: Connection,
    pageId: String,
    componentId: String
  ): IO[Either[HttpError, Unit]] =
    IO(UiPageTable.findById(connection, pageId)).map {
      case None =>
        Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(page) if page.components.exists(_.id == componentId) =>
        Left(UiCustomizationErrors.ComponentAlreadyExists(componentId).toHttpError)
      case Some(_) =>
        Right(())
    }

  def requireAddComponent(
    connection: Connection,
    pageId: String,
    component: PageComponent
  ): IO[Either[HttpError, PageConfig]] =
    IO(UiPageTable.addComponent(connection, pageId, component, Instant.now().toString)).map {
      case None      => Left(UiCustomizationErrors.ComponentAlreadyExists(component.id).toHttpError)
      case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
    }

  def requirePageWithComponent(
    connection: Connection,
    pageId: String,
    componentId: String
  ): IO[Either[HttpError, Unit]] =
    IO(UiPageTable.findById(connection, pageId)).map {
      case None =>
        Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(page) if !page.components.exists(_.id == componentId) =>
        Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
      case Some(_) =>
        Right(())
    }

  def requireUpdateComponent(
    connection: Connection,
    pageId: String,
    componentId: String,
    component: PageComponent
  ): IO[Either[HttpError, PageConfig]] = {
    val normalized = component match {
      case button: microservice.ui.objects.component.ButtonComponent => button.copy(id = componentId)
      case panel: microservice.ui.objects.component.PanelComponent   => panel.copy(id = componentId)
      case text: microservice.ui.objects.component.TextComponent     => text.copy(id = componentId)
      case list: microservice.ui.objects.component.ListComponent     => list.copy(id = componentId)
    }

    IO(UiPageTable.updateComponent(connection, pageId, componentId, normalized, Instant.now().toString)).map {
      case None      => Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
      case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
    }
  }

  def requireDeleteComponent(
    connection: Connection,
    pageId: String,
    componentId: String
  ): IO[Either[HttpError, PageConfig]] =
    IO(UiPageTable.deleteComponent(connection, pageId, componentId, Instant.now().toString)).map {
      case None      => Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
      case Some(row) => Right(UiPageRowMapper.toPageConfig(row))
    }
}
