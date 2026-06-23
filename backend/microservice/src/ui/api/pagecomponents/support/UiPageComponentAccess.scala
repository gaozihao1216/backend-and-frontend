package microservice.ui.api.pagecomponents.support

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.ui.objects.component.PageComponent
import microservice.ui.objects.page.PageConfig
import microservice.ui.objects.UiCustomizationErrors
import microservice.ui.tables.ui_page.{UiPageRowMapper, UiPageTable}

/** 页面组件 CRUD 的查存在与写结果校验。 */
private[pagecomponents] object UiPageComponentAccess {
  def requirePageForNewComponent(connection: Connection, pageId: String, componentId: String): Step[Unit] =
    PlanStep.fromEither(checkPageForNewComponent(connection, pageId, componentId))

  def requireAddComponent(connection: Connection, pageId: String, component: PageComponent): Step[PageConfig] =
    PlanStep.fromEither(checkAddComponent(connection, pageId, component))

  def requirePageWithComponent(connection: Connection, pageId: String, componentId: String): Step[Unit] =
    PlanStep.fromEither(checkPageWithComponent(connection, pageId, componentId))

  def requireUpdateComponent(
    connection: Connection,
    pageId: String,
    componentId: String,
    component: PageComponent
  ): Step[PageConfig] =
    PlanStep.fromEither(checkUpdateComponent(connection, pageId, componentId, component))

  def requireDeleteComponent(connection: Connection, pageId: String, componentId: String): Step[PageConfig] =
    PlanStep.fromEither(checkDeleteComponent(connection, pageId, componentId))

  def checkPageForNewComponent(
    connection: Connection,
    pageId: String,
    componentId: String
  ): Either[HttpError, Unit] =
    UiPageTable.findById(connection, pageId) match {
      case None =>
        Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(page) if page.components.exists(_.id == componentId) =>
        Left(UiCustomizationErrors.ComponentAlreadyExists(componentId).toHttpError)
      case Some(_) =>
        Right(())
    }

  def checkAddComponent(
    connection: Connection,
    pageId: String,
    component: PageComponent
  ): Either[HttpError, PageConfig] =
    UiPageTable
      .addComponent(connection, pageId, component, Instant.now().toString)
      .map(UiPageRowMapper.toPageConfig)
      .toRight(UiCustomizationErrors.ComponentAlreadyExists(component.id).toHttpError)

  def checkPageWithComponent(
    connection: Connection,
    pageId: String,
    componentId: String
  ): Either[HttpError, Unit] =
    UiPageTable.findById(connection, pageId) match {
      case None =>
        Left(UiCustomizationErrors.PageNotFound(pageId).toHttpError)
      case Some(page) if !page.components.exists(_.id == componentId) =>
        Left(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
      case Some(_) =>
        Right(())
    }

  def checkUpdateComponent(
    connection: Connection,
    pageId: String,
    componentId: String,
    component: PageComponent
  ): Either[HttpError, PageConfig] = {
    val normalized = component match {
      case button: microservice.ui.objects.component.ButtonComponent => button.copy(id = componentId)
      case panel: microservice.ui.objects.component.PanelComponent   => panel.copy(id = componentId)
      case text: microservice.ui.objects.component.TextComponent     => text.copy(id = componentId)
      case list: microservice.ui.objects.component.ListComponent     => list.copy(id = componentId)
    }
    UiPageTable
      .updateComponent(connection, pageId, componentId, normalized, Instant.now().toString)
      .map(UiPageRowMapper.toPageConfig)
      .toRight(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
  }

  def checkDeleteComponent(connection: Connection, pageId: String, componentId: String): Either[HttpError, PageConfig] =
    UiPageTable
      .deleteComponent(connection, pageId, componentId, Instant.now().toString)
      .map(UiPageRowMapper.toPageConfig)
      .toRight(UiCustomizationErrors.ComponentNotFound(componentId).toHttpError)
}
